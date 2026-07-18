const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const required = {
  index: path.join(root, 'public', 'index.html'),
  desktop: path.join(root, 'public', 'desktop-olx-home.js'),
  css: path.join(root, 'public', 'css', 'ehemehe-app.min.css')
};
for (const [name, file] of Object.entries(required)) {
  if (!fs.existsSync(file) || fs.statSync(file).size < 100) {
    throw new Error(`Desktop marketplace build is missing ${name}: ${path.relative(root, file)}`);
  }
}
const index = fs.readFileSync(required.index, 'utf8');
const desktop = fs.readFileSync(required.desktop, 'utf8');
const css = fs.readFileSync(required.css, 'utf8');
const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const checks = [
  [vercel.framework === null, 'vercel.json must force the Other framework preset'],
  [vercel.outputDirectory === 'public', 'vercel.json must force public as the deployment output'],
  [index.includes('ehmDesktopOlxHome'), 'index.html is missing the OLX-style desktop shell'],
  [index.includes('desktop-olx-home.js'), 'index.html does not load desktop-olx-home.js'],
  [index.includes('!window.__EHM_DESKTOP_OLX_HOME'), 'desktop home still starts the competing React implementation'],
  [desktop.includes('desktop-olx-home-v1-20260718'), 'desktop home asset has the wrong build marker'],
  [desktop.includes('Fresh recommendations'), 'desktop home asset is missing the requested recommendations layout'],
  [css.includes('.ehm-olx-search'), 'combined CSS is missing the OLX-style search bar'],
  [css.includes('grid-template-columns:repeat(4'), 'combined CSS is missing the four-column desktop ad grid']
];
for (const [ok, message] of checks) if (!ok) throw new Error(message);
for (const relative of ['dist','build','out','.next','.output',path.join('.vercel','output')]) {
  if (fs.existsSync(path.join(root, relative))) throw new Error(`Stale deployment output survived build: ${relative}`);
}
console.log('Desktop marketplace build verification passed: independent OLX-style home shell, four-column listings, and clean deployment output.');
