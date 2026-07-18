const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const required = {
  index: path.join(root, 'public', 'index.html'),
  filters: path.join(root, 'public', 'index-filters.js'),
  filtersMin: path.join(root, 'public', 'index-filters.min.js'),
  css: path.join(root, 'public', 'css', 'ehemehe-app.min.css')
};
for (const [name, file] of Object.entries(required)) {
  if (!fs.existsSync(file) || fs.statSync(file).size < 100) {
    throw new Error(`Desktop marketplace build is missing ${name}: ${path.relative(root, file)}`);
  }
}
const index = fs.readFileSync(required.index, 'utf8');
const filters = fs.readFileSync(required.filters, 'utf8');
const filtersMin = fs.readFileSync(required.filtersMin, 'utf8');
const css = fs.readFileSync(required.css, 'utf8');
const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const checks = [
  [vercel.framework === null, 'vercel.json must force the Other framework preset'],
  [vercel.outputDirectory === 'public', 'vercel.json must force public as the deployment output'],
  [index.includes('ehm-desktop-home-prepaint-class'), 'index.html is missing the stable desktop pre-paint guard'],
  [index.includes("import('/js/index-BsKly-Vj.js"), 'React application must remain the shared source for working routes'],
  [index.includes('index-filters.min.js'), 'desktop marketplace helper is not loaded'],
  [!index.includes('ehmDesktopOlxHome'), 'competing independent OLX demo shell still exists'],
  [!index.includes('desktop-olx-home.js'), 'competing desktop demo script still loads'],
  [filters.includes("<h2>${active ? 'Search Results' : 'Latest Ads'}</h2>"), 'Latest Ads desktop heading renderer is missing'],
  [filters.includes('ehm-desktop-grid'), 'working desktop live-ad grid is missing'],
  [filters.includes('await loadAds()'), 'desktop home does not load live marketplace ads'],
  [css.includes('.ehm-desktop-results'), 'combined CSS is missing the restored desktop results layout'],
  [css.includes('.ehm-desktop-grid'), 'combined CSS is missing the restored four-column-capable grid'],
  [filtersMin.length < filters.length, 'desktop helper was not minified']
];
for (const [ok, message] of checks) if (!ok) throw new Error(message);
for (const relative of ['dist','build','out','.next','.output',path.join('.vercel','output')]) {
  if (fs.existsSync(path.join(root, relative))) throw new Error(`Stale deployment output survived build: ${relative}`);
}
for (const relative of ['public/desktop-olx-home.js','public/css/desktop-olx-home.css']) {
  if (fs.existsSync(path.join(root, relative))) throw new Error(`Competing demo desktop asset survived build: ${relative}`);
}
console.log('Desktop marketplace build verification passed: previous live-ad layout restored, demo shell removed, and deployment output is clean.');
