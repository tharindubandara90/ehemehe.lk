const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = __dirname;
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const index = read('public/index.html');
const desktop = read('public/desktop-home-exact.js');
const appCss = read('public/css/ehemehe-app.min.css');
const packageJson = JSON.parse(read('package.json'));
const vercel = JSON.parse(read('vercel.json'));

assert(index.includes('ehm-desktop-home-exact-route'), 'Exact desktop route guard is missing.');
assert(index.includes('id="ehmDesktopHomeExact"'), 'Exact desktop host is missing.');
assert(index.includes("script('/desktop-home-exact.min.js"), 'Exact desktop script is not deployed.');
assert(index.includes("import('/js/index-BsKly-Vj.js"), 'React app for mobile and inner routes is missing.');
assert(index.includes('!window.__EHM_DESKTOP_HOME_EXACT'), 'React is not isolated from desktop home.');
assert(!index.includes('desktop-olx-home.js'), 'Wrong demo shell must not deploy.');
assert(desktop.includes('ehdx-header'), 'Requested compact header renderer is missing.');
assert(desktop.includes('ehdx-searchbar'), 'Requested one-row search renderer is missing.');
assert(desktop.includes('ehdx-categories'), 'Requested category shortcut renderer is missing.');
assert(desktop.includes('ehdx-grid'), 'Requested live ad grid renderer is missing.');
assert(desktop.includes("href=\"/ad/${encodeURIComponent(ad.id)}\""), 'Live ad-detail links are missing.');
assert(appCss.includes('.ehdx-header'), 'Exact desktop header CSS is missing from combined CSS.');
assert(appCss.includes('.ehdx-grid'), 'Exact desktop grid CSS is missing from combined CSS.');
assert.strictEqual(vercel.framework, null, 'Vercel framework must stay Other/null.');
assert(!Object.prototype.hasOwnProperty.call(vercel, 'outputDirectory'), 'Vercel must capture root server.js; public/** is served automatically by the CDN.');
assert(packageJson.scripts['prepare-assets'].includes('cleanup:deployment'), 'Build does not clean stale output.');
assert(packageJson.scripts['prepare-assets'].includes('verify:desktop-theme'), 'Build does not verify desktop view.');

for (const relative of ['dist', 'build', path.join('.vercel', 'output')]) {
  const dir = path.join(root, relative);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'old-theme.txt'), 'stale desktop theme');
}
for (const relative of ['public/desktop-olx-home.js','public/css/desktop-olx-home.css']) {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, 'stale competing desktop demo');
}
execFileSync(process.execPath, ['scripts/cleanup-stale-deployment-output.js'], { cwd: root, stdio: 'pipe' });
for (const relative of ['dist', 'build', path.join('.vercel', 'output'),'public/desktop-olx-home.js','public/css/desktop-olx-home.css']) {
  assert(!fs.existsSync(path.join(root, relative)), `Cleanup did not remove stale output: ${relative}`);
}
console.log('DESKTOP_THEME_DEPLOYMENT_REGRESSION_TEST_PASSED');
