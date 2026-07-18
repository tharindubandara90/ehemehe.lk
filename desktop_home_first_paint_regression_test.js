const assert = require('assert');
const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf8');
const desktop = fs.readFileSync('public/desktop-olx-home.js', 'utf8');
const css = fs.readFileSync('public/css/desktop-olx-home.css', 'utf8');

const prepaintIndex = html.indexOf('id="ehm-desktop-olx-prepaint"');
const shellIndex = html.indexOf('id="ehmDesktopOlxHome"');
const moduleIndex = html.indexOf("import('/js/index-BsKly-Vj.js");
assert(prepaintIndex >= 0, 'OLX-style desktop pre-paint script is missing.');
assert(shellIndex >= 0, 'Independent desktop marketplace shell is missing.');
assert(moduleIndex >= 0, 'React application import is missing for non-desktop-home routes.');
assert(prepaintIndex < moduleIndex, 'Desktop pre-paint setup must run before React.');
assert(html.includes('!window.__EHM_DESKTOP_OLX_HOME'), 'React is not gated off on the desktop home route.');
assert(html.includes('ehm-olx-search'), 'Desktop home search bar markup is missing.');
assert(html.includes('ehmOlxCategories'), 'Desktop category shortcut row is missing.');
assert(html.includes('Fresh recommendations'), 'Fresh recommendations section is missing.');
assert(desktop.includes("if (initialWasHome) markHomeActive();"), 'Desktop home is not activated before normal initialization.');
assert(desktop.includes('location.reload();'), 'SPA return-to-home does not clear the competing React home implementation.');
assert(desktop.includes("fetch('/api/public-home'"), 'Desktop shell does not load live public ads.');
assert(desktop.includes("fetch('/api/public-meta'"), 'Desktop shell does not load category/location metadata.');
assert(css.includes('grid-template-columns:repeat(4,minmax(0,1fr))'), 'Desktop listing grid is not four columns.');
assert(css.includes('grid-template-columns:minmax(280px,1.65fr)'), 'Desktop search/category/location bar layout is missing.');
assert(css.includes('html.ehm-desktop-olx-home-active #root{display:none!important}'), 'Competing React root is not hidden on desktop home.');
console.log('DESKTOP_HOME_FIRST_PAINT_REGRESSION_TEST_PASSED');
