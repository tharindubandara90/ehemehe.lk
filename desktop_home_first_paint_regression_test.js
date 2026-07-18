const assert = require('assert');
const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf8');
const desktop = fs.readFileSync('public/desktop-home-exact.js', 'utf8');
const desktopMin = fs.readFileSync('public/desktop-home-exact.min.js', 'utf8');
const css = fs.readFileSync('public/css/ehemehe-app.min.css', 'utf8');

const routeIndex = html.indexOf('id="ehm-desktop-home-exact-route"');
const moduleIndex = html.indexOf("import('/js/index-BsKly-Vj.js");
const hostIndex = html.indexOf('id="ehmDesktopHomeExact"');
assert(routeIndex >= 0, 'Exact desktop route guard is missing.');
assert(hostIndex >= 0, 'Exact desktop host is missing.');
assert(moduleIndex >= 0, 'Shared React application import was removed from other routes.');
assert(routeIndex < moduleIndex, 'Desktop route must be decided before React can start.');
assert(html.includes('!window.__EHM_DESKTOP_HOME_EXACT'), 'React is not skipped on the desktop home route.');
assert(html.includes("script('/desktop-home-exact.min.js"), 'Exact desktop helper is not loaded.');
assert(!html.includes('desktop-olx-home.js'), 'Obsolete demo desktop shell still loads.');
assert(desktop.includes("fetchJson('/api/public-home'"), 'Desktop home does not load live ads.');
assert(desktop.includes("fetchJson('/api/public-meta'"), 'Desktop home does not load live filters.');
assert(desktop.includes('Latest Ads'), 'Latest Ads heading is missing.');
assert(desktop.includes('grid-template-columns') === false, 'Layout CSS should not be duplicated inside the desktop JavaScript.');
assert(css.includes('.ehdx-searchbar'), 'Compact one-row desktop search styling is missing.');
assert(css.includes('.ehdx-categories'), 'Circular category row styling is missing.');
assert(css.includes('.ehdx-grid'), 'Four-column live-ad grid styling is missing.');
assert(desktopMin.length < desktop.length, 'Desktop helper was not minified.');
console.log('DESKTOP_HOME_FIRST_PAINT_REGRESSION_TEST_PASSED');
