const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');

const root = __dirname;
const serverSource = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const vercelConfig = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));

assert(serverSource.includes("'/api/update-my-ad': () => require('./api/update-my-ad')"), 'Update API must be lazy-loaded.');
assert(!serverSource.includes("const updateMyAd = require('./api/update-my-ad')"), 'Update API must not be loaded during function startup.');

const includeFiles = vercelConfig.builds?.[0]?.config?.includeFiles || [];
assert(includeFiles.includes('public/**'), 'Vercel function must include the public directory.');
assert(includeFiles.includes('api/**'), 'Vercel function must include API modules.');

const handler = require('./server');

function request(port, pathname, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path: pathname, method }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  const server = http.createServer((req, res) => Promise.resolve(handler(req, res)).catch((error) => {
    res.statusCode = 500;
    res.end(error.message);
  }));

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  try {
    const home = await request(port, '/');
    assert.strictEqual(home.status, 200, 'Home page must load without a function crash.');
    assert(/EheMehe|ehemehe\.lk/i.test(home.body), 'Home page content is missing.');

    const admin = await request(port, '/admin');
    assert.strictEqual(admin.status, 200, 'Admin route must load.');

    const updateApi = await request(port, '/api/update-my-ad');
    assert.strictEqual(updateApi.status, 405, 'Update API must load and reject unsupported methods normally.');

    const missingApi = await request(port, '/api/not-a-route');
    assert.strictEqual(missingApi.status, 404, 'Unknown API routes must return JSON 404 instead of crashing.');

    console.log('VERCEL_FUNCTION_STARTUP_REGRESSION_TEST_PASSED');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
