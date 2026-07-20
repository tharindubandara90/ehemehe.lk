const fs = require('fs');
const assert = require('assert');

const index = fs.readFileSync('public/index.html', 'utf8');
const css = fs.readFileSync('public/css/index-DcB2eYwd.css', 'utf8');
const perf = fs.readFileSync('public/performance-safe.js', 'utf8');
const robots = fs.readFileSync('public/robots.txt', 'utf8');
const sitemap = fs.readFileSync('public/sitemap.xml', 'utf8');
const llms = fs.readFileSync('public/llms.txt', 'utf8');
const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const adsUtils = fs.readFileSync('lib/public-ads-utils.js', 'utf8');

assert(index.includes('maximum-scale=5') && index.includes('user-scalable=yes'), 'Accessible viewport zoom configuration missing');
assert(index.includes('fonts.googleapis.com/css2?family=Plus+Jakarta+Sans'), 'Direct font stylesheet missing');
assert(!css.startsWith('@import'), 'CSS @import still blocks the main stylesheet');
assert(index.includes('/performance-safe.js?v='), 'Versioned non-visual performance helper missing');
assert(perf.includes("image.setAttribute('fetchpriority', 'high')"), 'LCP image priority guard missing');
assert(perf.includes("image.loading = 'lazy'"), 'Offscreen image lazy loading guard missing');
assert(perf.includes("button.setAttribute('aria-label'"), 'Accessible icon button labels missing');
assert(robots.includes('User-agent: *') && robots.includes('Sitemap: https://www.ehemehe.lk/sitemap.xml'), 'Valid robots.txt missing');
assert(sitemap.includes('<urlset') && sitemap.includes('https://www.ehemehe.lk/category/vehicles'), 'Sitemap is incomplete');
assert(llms.includes('# EheMehe.lk') && llms.includes('Main public pages'), 'llms.txt guidance missing');
assert(adsUtils.includes('imageVersion') && adsUtils.includes('&v='), 'Edited ad image cache busting missing');

const jsCssCache = vercel.routes.find((route) => route.src === '/(.*)\\.(?:js|css)');
assert(jsCssCache?.headers?.['Cache-Control']?.includes('immutable'), 'Long-lived versioned JS/CSS cache policy missing');
const security = vercel.routes.find((route) => route.headers?.['X-Content-Type-Options'] === 'nosniff');
assert(security, 'Safe global security headers missing');

// Core appearance and all existing feature scripts remain loaded.
[
  'index-filters.js', 'supabase.js', 'auth-session-bridge.js', 'dashboard-profile.js',
  'post-ad-category-fields.js', 'brand-theme.js', 'post-ad-runtime.js',
  'auth-unified.js', 'report-fixes.js', 'account-management.js'
].forEach((asset) => assert(index.includes(asset), `${asset} was removed from the existing site flow`));

console.log('PERFORMANCE_SAFE_NONVISUAL_REGRESSION_TEST_PASSED');
