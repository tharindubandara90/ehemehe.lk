const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = __dirname;
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const index = read('public/index.html');
const filters = read('public/index-filters.js');
const appCss = read('public/css/ehemehe-app.min.css');
const packageJson = JSON.parse(read('package.json'));
const vercel = JSON.parse(read('vercel.json'));

assert(index.includes('ehm-desktop-home-prepaint-class'), 'Stable desktop prepaint is missing.');
assert(index.includes("import('/js/index-BsKly-Vj.js"), 'Shared React app is missing.');
assert(index.includes('index-filters.min.js'), 'Live desktop helper is missing.');
assert(!index.includes('ehmDesktopOlxHome'), 'Independent demo shell must not replace the real marketplace.');
assert(!index.includes('desktop-olx-home.js'), 'Independent demo script must not deploy.');
assert(filters.includes("<h2>${active ? 'Search Results' : 'Latest Ads'}</h2>"), 'Previous Latest Ads heading is not restored.');
assert(filters.includes("rows.map((ad, index) => renderAdCard(ad, index, 'desktop'))"), 'Live ad cards are not rendered through the proven card implementation.');
assert(filters.includes('enhanceDesktopTopSearch'), 'Previous compact desktop search implementation is missing.');
assert(filters.includes('enhanceDesktopHeroControls'), 'Working category/location controls are missing.');
assert(appCss.includes('.ehm-desktop-results'), 'Previous desktop results styling is missing.');
assert(appCss.includes('.ehm-desktop-grid'), 'Previous desktop grid styling is missing.');
assert.strictEqual(vercel.framework, null, 'Vercel framework must stay Other/null.');
assert.strictEqual(vercel.outputDirectory, 'public', 'Vercel must deploy public.');
assert(packageJson.scripts['prepare-assets'].includes('cleanup:deployment'), 'Build does not clean stale deployment output.');
assert(packageJson.scripts['prepare-assets'].includes('verify:desktop-theme'), 'Build does not verify the restored desktop view.');

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
