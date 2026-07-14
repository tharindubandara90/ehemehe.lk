const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const source = path.join(publicDir, 'index.html');
const adRoot = path.join(publicDir, 'ad');

if (!fs.existsSync(source)) {
  throw new Error('public/index.html was not found.');
}

if (!fs.existsSync(adRoot)) {
  console.log('public/ad does not exist. Nothing to sync.');
  process.exit(0);
}

const html = fs.readFileSync(source, 'utf8');
let updated = 0;

for (const entry of fs.readdirSync(adRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const target = path.join(adRoot, entry.name, 'index.html');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html, 'utf8');
  updated += 1;
}

console.log(`Synced ${updated} ad route shells from public/index.html.`);
