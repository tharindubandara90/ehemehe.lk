const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const required = {
  index: path.join(root, 'public', 'index.html'),
  desktopSource: path.join(root, 'public', 'desktop-home-exact.js'),
  desktopMin: path.join(root, 'public', 'desktop-home-exact.min.js'),
  desktopCss: path.join(root, 'public', 'css', 'desktop-home-exact.css'),
  combinedCss: path.join(root, 'public', 'css', 'ehemehe-app.min.css'),
  mobileHelper: path.join(root, 'public', 'index-filters.min.js')
};
for (const [name, file] of Object.entries(required)) {
  if (!fs.existsSync(file) || fs.statSync(file).size < 100) {
    throw new Error(`Required marketplace build asset is missing: ${name} (${path.relative(root, file)})`);
  }
}
const index = fs.readFileSync(required.index, 'utf8');
const desktopSource = fs.readFileSync(required.desktopSource, 'utf8');
const desktopMin = fs.readFileSync(required.desktopMin, 'utf8');
const desktopCss = fs.readFileSync(required.desktopCss, 'utf8');
const combinedCss = fs.readFileSync(required.combinedCss, 'utf8');
const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const checks = [
  [vercel.framework === null, 'Vercel framework must remain Other'],
  [index.includes('ehm-desktop-home-exact-route'), 'desktop route guard is missing'],
  [index.includes('id="ehmDesktopHomeExact"'), 'desktop home host is missing'],
  [index.includes("script('/desktop-home-exact.min.js"), 'exact desktop script is not loaded'],
  [index.includes('!window.__EHM_DESKTOP_HOME_EXACT'), 'React must be skipped only on desktop home'],
  [desktopSource.includes('Latest Ads'), 'exact desktop Latest Ads renderer is missing'],
  [desktopSource.includes("fetchJson('/api/public-home'"), 'live marketplace endpoint is not used'],
  [desktopSource.includes("fetchJson('/api/public-meta'"), 'live filters endpoint is not used'],
  [desktopSource.includes("href=\"/ad/${encodeURIComponent(ad.id)}\""), 'database ad-detail link renderer is missing'],
  [desktopCss.includes('.ehdx-searchbar'), 'compact search bar CSS is missing'],
  [desktopCss.includes('grid-template-columns:repeat(4'), 'four-column desktop ad grid is missing'],
  [combinedCss.includes('.ehdx-results-section'), 'exact desktop CSS was not included in combined CSS'],
  [desktopMin.length < desktopSource.length, 'exact desktop helper was not minified'],
  [!index.includes('desktop-olx-home.js'), 'obsolete OLX demo shell is still loaded']
];
for (const [ok, message] of checks) if (!ok) throw new Error(message);
for (const relative of ['dist','build','out','.next','.output',path.join('.vercel','output')]) {
  if (fs.existsSync(path.join(root, relative))) throw new Error(`Stale deployment output survived build: ${relative}`);
}
console.log('Exact compact desktop marketplace build verification passed.');
