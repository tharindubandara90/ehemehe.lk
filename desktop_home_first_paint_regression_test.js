const assert = require('assert');
const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf8');
const filters = fs.readFileSync('public/index-filters.js', 'utf8');
const css = fs.readFileSync('public/css/ehemehe-app.min.css', 'utf8');

const prepaintIndex = html.indexOf('id="ehm-desktop-home-prepaint-class"');
const moduleIndex = html.indexOf("import('/js/index-BsKly-Vj.js");
const filterIndex = html.indexOf('index-filters.min.js');
assert(prepaintIndex >= 0, 'Desktop home pre-paint script is missing.');
assert(moduleIndex >= 0, 'React application import is missing.');
assert(filterIndex >= 0, 'Desktop marketplace helper is missing.');
assert(prepaintIndex < moduleIndex, 'Desktop prepaint setup must run before React.');
assert(!html.includes('ehmDesktopOlxHome'), 'A separate demo shell is competing with the real home page.');
assert(!html.includes('__EHM_DESKTOP_OLX_HOME'), 'Desktop home still gates off the real application.');
assert(filters.includes('stabilizeDesktopHomeShell'), 'Desktop hydration stabilizer is missing.');
assert(filters.includes('renderDesktopResults(true, false)'), 'Latest live ads are not rendered without auto-scroll.');
assert(filters.includes("<h2>${active ? 'Search Results' : 'Latest Ads'}</h2>"), 'Latest Ads heading renderer is missing.');
assert(filters.includes('enhanceDesktopTopSearch'), 'Compact desktop top search is missing.');
assert(filters.includes('enhanceDesktopHeroControls'), 'Category/location controls are missing.');
assert(css.includes('.ehm-desktop-results'), 'Desktop result section styles are missing.');
assert(css.includes('.ehm-desktop-grid'), 'Desktop card grid styles are missing.');
console.log('DESKTOP_HOME_FIRST_PAINT_REGRESSION_TEST_PASSED');
