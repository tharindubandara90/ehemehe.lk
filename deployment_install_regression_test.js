const fs = require('fs');
const assert = require('assert');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const lockText = fs.readFileSync('package-lock.json', 'utf8');
const lock = JSON.parse(lockText);
const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const npmrc = fs.readFileSync('.npmrc', 'utf8');
const server = fs.readFileSync('server.js', 'utf8');
const dependencyNames = new Set([
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {})
]);

assert(!dependencyNames.has('vercel'), 'Vercel CLI must not be installed inside a Vercel deployment');
assert(!dependencyNames.has('serve'), 'Unused serve package must not be installed');
assert.strictEqual(pkg.engines?.node, '24.x', 'Deployment Node version must match the Vercel project setting');
assert(!pkg.packageManager, 'Package-manager metadata must not force a mismatched bundled npm version');
assert.strictEqual(vercel.installCommand, 'npm ci --include=dev --no-audit --no-fund --prefer-online', 'Vercel must use deterministic clean installs');
assert.strictEqual(vercel.buildCommand, 'npm run build', 'Vercel build command must be explicit');
for (const legacyKey of ['builds', 'routes', 'functions', 'rewrites']) {
  assert(!Object.prototype.hasOwnProperty.call(vercel, legacyKey), `${legacyKey} must not compete with Vercel root-server auto detection`);
}
assert(server.includes("if (require.main === module || process.env.VERCEL) startHttpServer();"), 'Root server is not started in the Vercel runtime');
assert(server.includes('server.listen(port'), 'Root server does not expose the listen call required by Vercel server detection');
assert(!fs.existsSync('api'), 'Root api directory would create one Vercel Function per endpoint');
assert(fs.existsSync('server-routes'), 'Internal route modules were not moved outside the Vercel api directory');
assert(fs.readdirSync('server-routes').filter((name) => name.endsWith('.js')).length >= 17, 'Internal route modules are incomplete');
assert(server.includes("require('./server-routes/request-otp')"), 'Root server is not dispatching internal route modules');
assert(!lock.packages['node_modules/vercel'], 'Lockfile must not include the Vercel CLI');
assert(!Object.keys(lock.packages).some((name) => name.startsWith('node_modules/@vercel/')), 'Lockfile must not contain the Vercel CLI dependency tree');
assert(!/packages\.applied-caas-gateway1\.internal\.api\.openai\.org/i.test(lockText), 'Lockfile contains a private build-environment registry URL');
assert(!/"resolved"\s*:/i.test(lockText), 'Lockfile must resolve from the deployment registry instead of a captured private registry');
assert(/registry=https:\/\/registry\.npmjs\.org\//.test(npmrc), 'Project npm registry is not pinned to the public npm registry');
assert(Object.keys(lock.packages).length < 100, 'Dependency graph unexpectedly expanded');

console.log('DEPLOYMENT_INSTALL_REGRESSION_TEST_PASSED');
