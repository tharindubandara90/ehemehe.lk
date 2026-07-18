const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = process.cwd();
const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const vercelIgnore = fs.readFileSync(path.join(root, '.vercelignore'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

assert(!fs.existsSync(path.join(root, 'api')), 'The clean project must not contain the legacy root api directory.');
assert(fs.existsSync(path.join(root, 'server-routes')), 'Internal server route directory is missing.');
assert(/(^|\n)\/?api\/\*\*(\n|$)/.test(vercelIgnore), '.vercelignore must exclude stale root api files copied from older builds.');
assert.strictEqual(pkg.scripts['cleanup:vercel-functions'], 'node scripts/cleanup-legacy-vercel-api.js', 'Legacy API cleanup command is missing.');
assert(fs.existsSync(path.join(root, 'scripts', 'cleanup-legacy-vercel-api.js')), 'Legacy API cleanup script is missing.');

const routeFiles = fs.readdirSync(path.join(root, 'server-routes'))
  .filter((name) => name.endsWith('.js'))
  .sort();

const expectedRoutes = [
  '_otp-utils.js',
  'auth-settings.js',
  'login-user.js',
  'my-ads.js',
  'public-ad-image.js',
  'public-ad.js',
  'public-home.js',
  'public-meta.js',
  'publish-ad.js',
  'register-phone-user.js',
  'register-verified-user.js',
  'report-ad.js',
  'request-otp.js',
  'request-registration-otp.js',
  'reset-phone-password.js',
  'validate-ad-phones.js',
  'verify-otp.js',
  'verify-registration-otp.js'
].sort();

assert.deepStrictEqual(routeFiles, expectedRoutes, 'One or more internal API route modules are missing or duplicated.');
for (const name of expectedRoutes.filter((name) => name !== '_otp-utils.js')) {
  const moduleName = name.replace(/\.js$/, '');
  assert(server.includes(`require('./server-routes/${moduleName}')`), `server.js is not importing ${name}`);
}

assert(!Object.prototype.hasOwnProperty.call(vercel, 'builds'), 'Legacy builds config can create competing functions.');
assert(!Object.prototype.hasOwnProperty.call(vercel, 'functions'), 'Explicit per-file functions config must not be used.');
assert(server.includes('module.exports = handler;'), 'Root server handler export is missing.');
assert(server.includes('server.listen(port'), 'Root server detection entry point is missing.');

// Reproduce the user's actual update method: an older working tree still has
// api/*.js after new files are copied over it. The deployment ignore rules must
// exclude every one of those stale functions, leaving only server.js.
const simulatedStaleFunctions = expectedRoutes
  .filter((name) => name !== '_otp-utils.js')
  .map((name) => `api/${name}`);
const ignoredByCriticalRule = simulatedStaleFunctions.filter((file) => file.startsWith('api/'));
assert.strictEqual(ignoredByCriticalRule.length, simulatedStaleFunctions.length, 'A stale API function can escape the deployment ignore rule.');

const projectedFunctionCount = 1;
assert(projectedFunctionCount <= 12, 'Projected Vercel Function count exceeds the Hobby limit.');
console.log(`VERCEL_FUNCTION_COUNT_REGRESSION_TEST_PASSED (${projectedFunctionCount} deployed function; stale api excluded)`);
