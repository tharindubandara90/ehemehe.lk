const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const required = {
  index: path.join(root, 'public', 'index.html'),
  helper: path.join(root, 'public', 'index-filters.min.js'),
  critical: path.join(root, 'public', 'desktop-home-critical-v4.js'),
  css: path.join(root, 'public', 'css', 'ehemehe-app.min.css')
};

for (const [name, file] of Object.entries(required)) {
  if (!fs.existsSync(file) || fs.statSync(file).size < 100) {
    throw new Error(`Desktop theme build is missing ${name}: ${path.relative(root, file)}`);
  }
}

const index = fs.readFileSync(required.index, 'utf8');
const helper = fs.readFileSync(required.helper, 'utf8');
const critical = fs.readFileSync(required.critical, 'utf8');
const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const checks = [
  [vercel.framework === null, 'vercel.json must force the Other framework preset'],
  [vercel.outputDirectory === 'public', 'vercel.json must force public as the deployment output'],
  [index.includes('desktop-home-critical-v4.js'), 'index.html does not load desktop-home-critical-v4.js'],
  [index.includes('ehm-desktop-theme-v4-ready'), 'index.html is missing the desktop v4 critical CSS marker'],
  [helper.includes('ehmDesktopHeroFilterbar'), 'minified home helper is missing the desktop hero filterbar'],
  [helper.includes('ehmDesktopResults'), 'minified home helper is missing the desktop live-results host'],
  [critical.includes('desktop-home-v4-20260718'), 'critical desktop asset has the wrong build marker']
];
for (const [ok, message] of checks) if (!ok) throw new Error(message);

for (const relative of ['dist', 'build', 'out', '.next', '.output', path.join('.vercel', 'output')]) {
  if (fs.existsSync(path.join(root, relative))) throw new Error(`Stale deployment output survived build: ${relative}`);
}

console.log('Desktop theme build verification passed: v4 shell, live results, and clean deployment output.');
