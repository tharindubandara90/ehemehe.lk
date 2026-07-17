const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

const root = __dirname;
const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

assert.strictEqual(config.outputDirectory, 'public', 'Vercel must serve the frontend from the public directory.');
assert(!config.builds, 'Legacy builds configuration must not be used.');
assert(!config.routes, 'The frontend must not be routed through a catch-all serverless function.');
assert(Array.isArray(config.rewrites) && config.rewrites.some((rule) => rule.destination === '/index.html'), 'SPA fallback rewrite is missing.');
assert(!fs.existsSync(path.join(root, 'server.js')), 'A root server.js would make Vercel run every page through a function again.');
assert(fs.existsSync(path.join(root, 'local-server.js')), 'Local development server is missing.');
assert.strictEqual(packageJson.scripts.start, 'node local-server.js', 'Local start script is incorrect.');

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

  console.log('VERCEL_STATIC_FRONTEND_AND_API_REGRESSION_TEST_PASSED');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
