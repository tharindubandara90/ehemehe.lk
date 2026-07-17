const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

const root = __dirname;
const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

assert(Array.isArray(config.builds), 'Vercel builds allowlist is missing.');

const staticBuild = config.builds.find((item) => item.src === 'package.json');
assert(staticBuild, 'Static frontend build is missing.');
assert.strictEqual(staticBuild.use, '@vercel/static-build', 'Frontend must use @vercel/static-build, not the Node backend builder.');
assert.strictEqual(staticBuild.config?.distDir, 'public', 'Static frontend output must come from public/.');

const apiBuild = config.builds.find((item) => item.src === 'api/*.js');
assert(apiBuild, 'API function build is missing.');
assert.strictEqual(apiBuild.use, '@vercel/node', 'API files must be built as isolated Vercel functions.');

assert(!config.functions, 'The functions property cannot be combined with legacy builds.');
assert(!config.framework, 'A framework preset must not force the project into the generic Node backend builder.');
assert(!config.outputDirectory, 'outputDirectory is intentionally handled by the static-build distDir.');
assert(!config.buildCommand, 'buildCommand is intentionally handled by @vercel/static-build.');

assert(Array.isArray(config.routes), 'Explicit Vercel routes are missing.');
assert(config.routes.some((rule) => rule.src === '/api/(.*)' && rule.dest === '/api/$1.js'), 'API rewrite route is missing.');
assert(config.routes.some((rule) => rule.handle === 'filesystem'), 'Filesystem routing must run before the SPA fallback.');
assert(config.routes.some((rule) => rule.dest === '/index.html'), 'SPA fallback route is missing.');
assert(!config.routes.some((rule) => String(rule.dest || '').includes('server.js')), 'The frontend must not be routed through a catch-all serverless function.');

assert(!fs.existsSync(path.join(root, 'server.js')), 'A root server.js is not required and must not be used by Vercel.');
assert(fs.existsSync(path.join(root, 'local-server.js')), 'Local development server is missing.');
assert.strictEqual(packageJson.scripts.start, 'node local-server.js', 'Local start script is incorrect.');
assert(!packageJson.devDependencies?.vercel && !packageJson.dependencies?.vercel, 'The Vercel CLI must not be installed as an application dependency.');

for (const file of ['request-otp.js', 'publish-ad.js', 'update-my-ad.js', 'report-ad.js']) {
  assert(fs.existsSync(path.join(root, 'api', file)), `API function ${file} is missing.`);
}

function responseRecorder() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    writableEnded: false,
    setHeader(name, value) { this.headers[String(name).toLowerCase()] = value; },
    end(value = '') { this.body += String(value); this.writableEnded = true; }
  };
}

(async () => {
  const updateHandler = require('./api/update-my-ad');
  const updateReq = new EventEmitter();
  updateReq.method = 'PATCH';
  updateReq.headers = {};
  updateReq.body = { id: 'example' };
  const updateRes = responseRecorder();
  await updateHandler(updateReq, updateRes);
  assert.strictEqual(updateRes.statusCode, 401, 'Pre-parsed Vercel request bodies must be accepted by the update API.');

  const reportHandler = require('./api/report-ad');
  const reportReq = new EventEmitter();
  reportReq.method = 'POST';
  reportReq.headers = {};
  reportReq.socket = { remoteAddress: '127.0.0.1' };
  reportReq.body = { adId: '', reason: 'spam' };
  const reportRes = responseRecorder();
  await reportHandler(reportReq, reportRes);
  assert.strictEqual(reportRes.statusCode, 400, 'Pre-parsed Vercel request bodies must be accepted by the report API.');

  console.log('VERCEL_EXPLICIT_STATIC_AND_API_BUILD_REGRESSION_TEST_PASSED');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
