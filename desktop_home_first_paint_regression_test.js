const assert = require('assert');
const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf8');
const filters = fs.readFileSync('public/index-filters.js', 'utf8');

const prepaintClassIndex = html.indexOf('id="ehm-desktop-home-prepaint-class"');
const appModuleIndex = html.indexOf("await import('/js/index-BsKly-Vj.js");
assert(prepaintClassIndex >= 0, 'Desktop home early setup script is missing.');
assert(appModuleIndex >= 0, 'React application module import is missing.');
assert(prepaintClassIndex < appModuleIndex, 'Desktop setup must run before the React application module.');

assert(
  !html.includes('html.ehm-desktop-home-prepaint [data-yw="c3JjL2NvbXBvbmVudHMvSGVyb1NlY3Rpb24udHN4QDYwOjE0"]'),
  'The native hero location wrapper must not be hidden during first paint.'
);
assert(html.includes('animation: none !important;'), 'Desktop hero entrance animation reset is missing.');
assert(html.includes('opacity: 1 !important;'), 'Desktop hero first-paint opacity reset is missing.');

assert(filters.includes('function installDesktopHomePrepaintWatcher()'), 'Early desktop observer is missing.');
assert(filters.includes('installDesktopHomePrepaintWatcher();\n  beginDynamicDetailPending();'), 'Early desktop observer is not installed before normal init.');
assert(filters.includes('return isHomeRoute() || isAdRoute();'), 'Desktop home is not covered by the route observer.');
assert(filters.includes('document.getElementById(\'ehmDesktopHeroFilterbar\')?.remove();'), 'Legacy delayed filter overlay is not removed.');
assert(filters.includes("searchBar.insertBefore(categoryField, locationField);"), 'Category control is not inserted into the stable native search grid.');
assert(filters.includes("location.id = 'ehmDesktopHeroLocation';"), 'Native location control is not reused.');
assert(filters.includes("cat.id = 'ehmDesktopHeroCategory';"), 'Native category control is not reused.');
assert(!filters.includes("bar.classList.add('ehm-inline')"), 'The delayed absolute-position overlay is still enabled.');
assert(filters.includes('stabilizeDesktopHomeShell();\n    renderDesktopResults(true, false);'), 'Desktop final shell is not rendered before network work.');
assert(filters.includes('Promise.allSettled(['), 'Desktop data requests are not parallelized.');
assert(!filters.includes('setTimeout(ensureDesktopHome, 500)'), 'Old delayed desktop rewrite is still present.');
assert(!filters.includes('setTimeout(ensureDesktopHome, 1400)'), 'Old second delayed desktop rewrite is still present.');

const immediateShell = filters.indexOf('// Render the final desktop shell immediately');
const dataLoad = filters.indexOf('desktopDataPromise = Promise.allSettled', immediateShell);
assert(immediateShell >= 0 && dataLoad > immediateShell, 'Desktop shell must be stabilized before Supabase requests begin.');

console.log('DESKTOP_HOME_FIRST_PAINT_REGRESSION_TEST_PASSED');
