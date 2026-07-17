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
assert.strictEqual(staticBuild.use, '@vercel/static-build');
assert.strictEqual(staticBuild.config?.distDir, 'public');

const functionBuilds = config.builds.filter((item) => item.use === '@vercel/node');
assert.strictEqual(functionBuilds.length, 1, 'Hobby deployment must create only one Vercel Function.');
assert.strictEqual(functionBuilds[0].src, 'api/index.js', 'The single API dispatcher function is missing.');

assert(Array.isArray(config.routes), 'Explicit Vercel routes are missing.');
assert(config.routes.some((rule) => rule.src === '/api/(.*)' && rule.dest === '/api/index.js?__api_route=$1'), 'API dispatcher rewrite is missing.');
assert(config.routes.some((rule) => rule.handle === 'filesystem'));
assert(config.routes.some((rule) => rule.dest === '/index.html'));
assert(!config.routes.some((rule) => String(rule.dest || '').includes('server.js')));

assert(fs.existsSync(path.join(root, 'api', 'index.js')), 'Single API function is missing.');
assert(fs.existsSync(path.join(root, 'lib', 'api-dispatcher.js')), 'Shared API dispatcher is missing.');
assert(!fs.existsSync(path.join(root, 'server.js')), 'Root server.js must not be used by Vercel.');
assert.strictEqual(packageJson.scripts.start, 'node local-server.js');
assert(!packageJson.devDependencies?.vercel && !packageJson.dependencies?.vercel);

const handlerFiles = fs.readdirSync(path.join(root, 'api-handlers')).filter((name) => name.endsWith('.js'));
assert.strictEqual(handlerFiles.length, 18, 'All 18 API handlers must remain available behind the dispatcher.');
assert(fs.readdirSync(path.join(root, 'api')).filter((name) => name.endsWith('.js')).length === 1, 'Only one file may be deployed from api/.');

function responseRecorder() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    writableEnded: false,
    setHeader(name, value) { this.headers[String(name).toLowerCase()] = value; },
    end(value = '') { this.body += Buffer.isBuffer(value) ? value.toString('utf8') : String(value); this.writableEnded = true; }
  };
}

(async () => {
  const dispatcher = require('./api/index');

  const authReq = new EventEmitter();
  authReq.method = 'GET';
  authReq.headers = {};
  authReq.url = '/api/index.js?__api_route=auth-settings';
  authReq.query = { __api_route: 'auth-settings' };
  const authRes = responseRecorder();
  await dispatcher(authReq, authRes);
  assert.strictEqual(authRes.statusCode, 200, 'Dispatcher did not reach auth-settings.');

  const updateHandler = require('./api-handlers/update-my-ad');
  const updateReq = new EventEmitter();
  updateReq.method = 'PATCH';
  updateReq.headers = {};
  updateReq.body = { id: 'example' };
  const updateRes = responseRecorder();
  await updateHandler(updateReq, updateRes);
  assert.strictEqual(updateRes.statusCode, 401, 'Pre-parsed Vercel request bodies must be accepted.');

  const missingReq = new EventEmitter();
  missingReq.method = 'GET';
  missingReq.headers = {};
  missingReq.url = '/api/index.js?__api_route=missing-route';
  missingReq.query = { __api_route: 'missing-route' };
  const missingRes = responseRecorder();
  await dispatcher(missingReq, missingRes);
  assert.strictEqual(missingRes.statusCode, 404, 'Unknown API routes must return 404.');

  console.log('VERCEL_HOBBY_SINGLE_API_FUNCTION_REGRESSION_TEST_PASSED');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
