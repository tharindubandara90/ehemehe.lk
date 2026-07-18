const fs = require('fs');
const assert = require('assert');

const css = fs.readFileSync('public/brand-theme.css', 'utf8');
const js = fs.readFileSync('public/brand-theme.js', 'utf8');
const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));

assert(css.includes('OLX-inspired desktop home layout'), 'Desktop marketplace layout CSS is missing');
assert(css.includes('@media (min-width: 1024px)'), 'Desktop layout must be isolated from mobile');
assert(css.includes('.ehm-olx-search-bar'), 'Combined desktop search bar styling is missing');
assert(css.includes('grid-template-columns: minmax(520px, 1.75fr) minmax(260px, .85fr) 152px'), 'Search/location layout is missing');
assert(css.includes('.ehm-olx-category-grid'), 'Circular desktop category strip styling is missing');
assert(css.includes('grid-template-columns: repeat(8'), 'Eight-category desktop row is missing');
assert(css.includes('.ehm-olx-latest-grid'), 'Fresh recommendations grid styling is missing');
assert(css.includes('grid-template-columns: repeat(4'), 'Four-column desktop ad grid is missing');

assert(js.includes('function enhanceDesktopHomeOlx()'), 'Desktop home enhancer is missing');
assert(js.includes("window.matchMedia('(min-width: 1024px)')"), 'Desktop enhancer is not protected from mobile');
assert(js.includes("favorite.textContent = 'Favorites'"), 'Favorites header link is missing');
assert(!js.includes("categorySelect.innerHTML = '<option value=\"\">All categories</option>'"), 'Desktop category selector must be removed');
assert(js.includes("latestTitle.textContent = 'Fresh recommendations'"), 'Fresh recommendations heading is missing');
assert(!js.includes("params.set('category', category)"), 'Desktop keyword search must not submit a category constraint');
assert(js.includes("document.body.classList.toggle('ehm-desktop-olx-home', active)"), 'Desktop home route scoping is missing');

const functionBuilds = (vercel.builds || []).filter((build) => build.use === '@vercel/node');
assert.strictEqual(functionBuilds.length, 1, 'Deployment must remain within the single Vercel function architecture');
assert.strictEqual(functionBuilds[0].src, 'api/index.js', 'The single Vercel function entry must remain api/index.js');

console.log('DESKTOP_OLX_HOME_LAYOUT_REGRESSION_TEST_PASSED');
