const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const staleDirectories = [
  'dist',
  'build',
  'out',
  '.next',
  '.output',
  path.join('.vercel', 'output'),
  'public-old',
  'public_backup',
  'public-backup'
];

let removed = 0;
for (const relative of staleDirectories) {
  const target = path.join(root, relative);
  if (!fs.existsSync(target)) continue;
  fs.rmSync(target, { recursive: true, force: true });
  removed += 1;
  console.log(`Removed stale deployment output: ${relative}`);
}

// A root-level index.html/assets tree belonged to an old static deployment.
// The current application source of truth is public/** plus server.js.
const staleRootFiles = [
  'index.html',
  path.join('public', 'desktop-home-critical-v4.js'),
  path.join('public', 'desktop-olx-home.js'),
  path.join('public', 'css', 'desktop-olx-home.css')
];
for (const relative of staleRootFiles) {
  const target = path.join(root, relative);
  if (!fs.existsSync(target)) continue;
  fs.rmSync(target, { force: true });
  removed += 1;
  console.log(`Removed stale/competing frontend file: ${relative}`);
}

console.log(`Stale deployment cleanup complete (${removed} item${removed === 1 ? '' : 's'} removed).`);
