const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = __dirname;
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const index = read('public/index.html');
const helper = read('public/index-filters.min.js');
const critical = read('public/desktop-home-critical-v4.js');
const packageJson = JSON.parse(read('package.json'));
const vercel = JSON.parse(read('vercel.json'));

assert(index.includes('ehm-desktop-home-critical-v4'), 'Critical desktop shell script tag is missing.');
assert(index.indexOf('ehm-desktop-home-critical-v4') < index.indexOf('type="module"'), 'Critical desktop shell must load before React.');
assert(index.includes('ehm-desktop-theme-v4-ready'), 'Critical desktop CSS marker is missing.');
assert(helper.includes('ehmDesktopHeroFilterbar'), 'Built helper is missing the new desktop filters.');
assert(helper.includes('ehmDesktopResults'), 'Built helper is missing the new desktop listings section.');
assert(critical.includes('desktop-home-v4-20260718'), 'Critical shell build marker is wrong.');
assert.strictEqual(vercel.framework, null, 'Vercel framework must be explicitly set to Other/null.');
assert.strictEqual(vercel.outputDirectory, 'public', 'Vercel must deploy the current public directory, not a stale dashboard output directory.');
assert(Array.isArray(vercel.headers) && vercel.headers.some((entry) => entry.source === '/'), 'Home HTML cache reset header is missing.');
assert(packageJson.scripts['prepare-assets'].includes('cleanup:deployment'), 'Build does not clean stale deployment output.');
assert(packageJson.scripts['prepare-assets'].includes('verify:desktop-theme'), 'Build does not verify the final desktop theme.');

// Simulate the exact Windows overlay-copy problem: old output folders remain
// because copying/replacing files does not delete folders absent from the ZIP.
for (const relative of ['dist', 'build', path.join('.vercel', 'output')]) {
  const dir = path.join(root, relative);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'old-theme.txt'), 'stale desktop theme');
}
execFileSync(process.execPath, ['scripts/cleanup-stale-deployment-output.js'], { cwd: root, stdio: 'pipe' });
for (const relative of ['dist', 'build', path.join('.vercel', 'output')]) {
  assert(!fs.existsSync(path.join(root, relative)), `Cleanup did not remove stale output: ${relative}`);
}

console.log('DESKTOP_THEME_DEPLOYMENT_REGRESSION_TEST_PASSED');
