const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = __dirname;
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const index = read('public/index.html');
const desktop = read('public/desktop-olx-home.js');
const appCss = read('public/css/ehemehe-app.min.css');
const packageJson = JSON.parse(read('package.json'));
const vercel = JSON.parse(read('vercel.json'));

assert(index.includes('id="ehm-desktop-olx-home"'), 'Desktop marketplace script tag is missing.');
assert(index.indexOf('desktop-olx-home.js') < index.indexOf('type="module"'), 'Desktop marketplace script must load before React.');
assert(index.includes('id="ehmDesktopOlxHome"'), 'Static desktop marketplace shell is missing from build output.');
assert(index.includes('Favorites') && index.includes('Account') && index.includes('Post an Ad'), 'Requested desktop header actions are incomplete.');
assert(desktop.includes('desktop-olx-home-v1-20260718'), 'Desktop marketplace build marker is wrong.');
assert(desktop.includes('Fresh recommendations'), 'Requested recommendation layout is not in the deployed script.');
assert(appCss.includes('.ehm-olx-category-icon'), 'OLX-style desktop CSS was not merged into the deployed stylesheet.');
assert.strictEqual(vercel.framework, null, 'Vercel framework must be explicitly set to Other/null.');
assert.strictEqual(vercel.outputDirectory, 'public', 'Vercel must deploy the current public directory.');
assert(Array.isArray(vercel.headers) && vercel.headers.some((entry) => entry.source === '/'), 'Home HTML cache reset header is missing.');
assert(packageJson.scripts['prepare-assets'].includes('cleanup:deployment'), 'Build does not clean stale deployment output.');
assert(packageJson.scripts['prepare-assets'].includes('verify:desktop-theme'), 'Build does not verify the final desktop theme.');

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
