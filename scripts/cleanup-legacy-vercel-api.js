const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const legacyPaths = [
  path.join(root, 'api'),
  path.join(root, 'app', 'api'),
  path.join(root, 'pages', 'api'),
  path.join(root, 'src', 'api')
];

let removed = 0;
for (const target of legacyPaths) {
  if (!fs.existsSync(target)) continue;
  fs.rmSync(target, { recursive: true, force: true });
  removed += 1;
  console.log(`Removed legacy Vercel function directory: ${path.relative(root, target)}`);
}

if (removed === 0) {
  console.log('No legacy Vercel API directories were present.');
}

const server = path.join(root, 'server.js');
const routes = path.join(root, 'server-routes');
if (!fs.existsSync(server) || !fs.existsSync(routes)) {
  console.error('ERROR: server.js or server-routes is missing. Do not deploy this folder.');
  process.exit(1);
}

console.log('Vercel layout ready: one root server function with internal server-routes.');
