const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

const htmlFiles = [
  'index.html',
  'post-ad.html',
  'admin.html',
  path.join('admin', 'index.html'),
  'browse.html',
  path.join('browse', 'index.html'),
  '404.html'
].map((name) => path.join(publicDir, name)).filter(fs.existsSync);

const assetUrls = [
  '/sms-verification-service.js',
  '/js/index-BsKly-Vj.js',
  '/post-ad-runtime.css',
  '/post-ad-form-fixes.css',
  '/brand-theme.css',
  '/auth-unified.css',
  '/supabase.js',
  '/auth-session-bridge.js',
  '/post-ad-category-fields.js',
  './post-ad-category-fields.js',
  '/index-filters.js',
  './index-filters.js',
  '/brand-theme.js',
  '/post-ad-runtime.js',
  '/auth-unified.js',
  '/post-ad.js',
  '/admin.js'
];

function assetPath(url) {
  const normalized = url.replace(/^\.\//, '/').replace(/^\//, '');
  return path.join(publicDir, normalized);
}

function contentHash(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16);
}

const versions = new Map();
for (const url of assetUrls) {
  const file = assetPath(url);
  if (!fs.existsSync(file)) continue;
  versions.set(url, contentHash(file));
}

let replacements = 0;
for (const htmlFile of htmlFiles) {
  let html = fs.readFileSync(htmlFile, 'utf8');
  for (const [url, version] of versions) {
    const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`${escaped}(?:\\?v=[A-Za-z0-9_.-]+)?`, 'g');
    html = html.replace(pattern, (match) => {
      const next = `${url}?v=${version}`;
      if (match !== next) replacements += 1;
      return next;
    });
  }
  fs.writeFileSync(htmlFile, html, 'utf8');
}

console.log(`Updated ${replacements} local asset version reference(s) using content hashes.`);
