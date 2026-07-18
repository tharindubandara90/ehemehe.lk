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

const imageAssetUrls = [
  '/assets/ehemehe_favicon.png',
  '/assets/ehemehe_favicon_64.png',
  '/assets/ehemehe_logo.png',
  '/assets/ehemehe_logo_header.png',
  '/assets/ehemehe_logo_header.webp'
];

const assetUrls = [
  '/css/ehemehe-app.min.css',
  '/css/index-DcB2eYwd.css',
  '/css/site-enhancements.css',
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
  '/desktop-olx-home.js',
  '/css/desktop-olx-home.css',
  '/index-filters.min.js',
  './index-filters.min.js',
  '/index-filters.js',
  './index-filters.js',
  '/brand-theme.js',
  '/post-ad-runtime.js',
  '/auth-unified.js',
  '/post-ad.js',
  '/admin.js',
  ...imageAssetUrls
];

const imageReferenceFiles = [
  ...htmlFiles,
  path.join(publicDir, 'brand-theme.js'),
  path.join(publicDir, 'admin', 'brand-theme.js'),
  path.join(publicDir, 'brand-theme.css'),
  path.join(publicDir, 'css', 'site-enhancements.css')
].filter(fs.existsSync);

function assetPath(url) {
  const normalized = url.replace(/^\.\//, '/').replace(/^\//, '');
  return path.join(publicDir, normalized);
}

function contentHash(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16);
}

function replaceReferences(file, versions) {
  let content = fs.readFileSync(file, 'utf8');
  let replacements = 0;
  for (const [url, version] of versions) {
    const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`${escaped}(?:\\?v=[A-Za-z0-9_.-]+)?`, 'g');
    content = content.replace(pattern, (match) => {
      const next = `${url}?v=${version}`;
      if (match !== next) replacements += 1;
      return next;
    });
  }
  fs.writeFileSync(file, content, 'utf8');
  return replacements;
}

let replacements = 0;

// First version image references inside JavaScript/CSS. These changes alter the
// helper-file hashes, so code hashes are deliberately calculated afterwards.
const imageVersions = new Map();
for (const url of imageAssetUrls) {
  const file = assetPath(url);
  if (fs.existsSync(file)) imageVersions.set(url, contentHash(file));
}
for (const file of imageReferenceFiles) replacements += replaceReferences(file, imageVersions);

const versions = new Map();
for (const url of assetUrls) {
  const file = assetPath(url);
  if (!fs.existsSync(file)) continue;
  versions.set(url, contentHash(file));
}
for (const htmlFile of htmlFiles) replacements += replaceReferences(htmlFile, versions);

console.log(`Updated ${replacements} local asset version reference(s) using content hashes.`);
