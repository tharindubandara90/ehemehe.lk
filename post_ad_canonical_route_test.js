const assert = require('assert');
const fs = require('fs');

const bundle = fs.readFileSync('public/js/index-BsKly-Vj.js', 'utf8');
const brand = fs.readFileSync('public/brand-theme.js', 'utf8');
const server = fs.readFileSync('server.js', 'utf8');
const adminHtml = fs.readFileSync('public/admin.html', 'utf8');
const nestedAdminHtml = fs.readFileSync('public/admin/index.html', 'utf8');
const nestedBrand = fs.readFileSync('public/admin/brand-theme.js', 'utf8');

assert(bundle.includes('path:"post",element:'), 'React /post route is missing.');
assert(!brand.includes("setAttribute('href','/post-ad')"), 'Brand helper still redirects /post links to the legacy form.');
assert(brand.includes("a[href=\"/post-ad\"],a[href=\"/post-ad/\"]"), 'Legacy link normalization is missing.');
assert(brand.includes("setAttribute('href','/post')"), 'Legacy links are not normalized to /post.');
assert(server.includes("pathname === '/post-ad.html'"), 'Direct legacy HTML route is not handled.');
assert(server.includes("res.statusCode = 308"), 'Legacy Post Ad route is not redirected.');
assert(server.includes("res.setHeader('Location', `/post${url.search || ''}`)"), 'Redirect does not preserve query parameters.');
assert(adminHtml.includes('href="/post" target="_blank"'), 'Admin Post Ad quick link is not canonical.');
assert(nestedAdminHtml.includes('href="/post" target="_blank"'), 'Nested admin Post Ad quick link is not canonical.');
assert(!nestedBrand.includes("setAttribute('href','/post-ad')"), 'Nested brand helper still redirects to the legacy form.');

console.log('POST_AD_CANONICAL_ROUTE_TEST_PASSED');
