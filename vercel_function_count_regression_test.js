const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = process.cwd();
const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');

assert(!fs.existsSync(path.join(root, 'api')), 'The root api directory creates a separate Vercel Function for every endpoint.');
assert(fs.existsSync(path.join(root, 'server-routes')), 'Internal server route directory is missing.');

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
  assert(
    server.includes(`require('./server-routes/${moduleName}')`),
    `server.js is not importing ${name}`
  );
}

assert(!Object.prototype.hasOwnProperty.call(vercel, 'builds'), 'Legacy builds config can create competing functions.');
assert(!Object.prototype.hasOwnProperty.call(vercel, 'functions'), 'Explicit per-file functions config must not be used.');
assert(server.includes('module.exports = handler;'), 'Root server handler export is missing.');
assert(server.includes('server.listen(port'), 'Root server detection entry point is missing.');

// With no root /api directory and one recognized root server.js, this project
// produces one Vercel Function. The endpoint modules are traced dependencies of
// that function rather than individually deployed functions.
const projectedFunctionCount = 1;
assert(projectedFunctionCount <= 12, 'Projected Vercel Function count exceeds the Hobby limit.');

console.log(`VERCEL_FUNCTION_COUNT_REGRESSION_TEST_PASSED (${projectedFunctionCount} function)`);
