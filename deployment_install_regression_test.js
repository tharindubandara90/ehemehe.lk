const fs = require('fs');
const assert = require('assert');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const dependencyNames = new Set([
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {})
]);

assert(!dependencyNames.has('vercel'), 'Vercel CLI must not be installed inside a Vercel deployment');
assert(!dependencyNames.has('serve'), 'Unused serve package must not be installed');
assert.strictEqual(pkg.engines?.node, '22.x', 'Deployments must use the pinned Node.js 22 runtime');
assert.strictEqual(pkg.packageManager, 'npm@10.9.2', 'npm version metadata must stay deterministic');
assert.strictEqual(
  vercel.installCommand,
  'npm ci --include=dev --no-audit --no-fund',
  'Vercel must use deterministic clean installs'
);
assert(!lock.packages['node_modules/vercel'], 'Lockfile must not include the Vercel CLI');
assert(
  !Object.keys(lock.packages).some((name) => name.startsWith('node_modules/@vercel/')),
  'Lockfile must not contain the Vercel CLI dependency tree'
);
assert(Object.keys(lock.packages).length < 100, 'Dependency graph unexpectedly expanded');

console.log('DEPLOYMENT_INSTALL_REGRESSION_TEST_PASSED');
