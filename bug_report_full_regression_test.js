const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const reportJs = read('public/report-fixes.js');
const reportCss = read('public/report-fixes.css');
const filters = read('public/index-filters.js');
const postRuntime = read('public/post-ad-runtime.js');
const dispatcher = read('lib/api-dispatcher.js');

const shells = [
  'public/index.html', 'public/terms.html', 'public/privacy.html', 'public/safety.html', 'public/contact.html',
  'public/terms/index.html', 'public/privacy/index.html', 'public/safety/index.html', 'public/contact/index.html'
];
for (const file of shells) {
  const html = read(file);
  assert(html.includes('/report-fixes.css?v='), `${file} does not load the common report CSS.`);
  assert(html.includes('/report-fixes.js?v='), `${file} does not load the common report JavaScript.`);
}

assert(reportJs.includes('data-ehm-footer-version="1"'), 'Unified footer implementation missing.');
assert(reportCss.includes('grid-template-columns:minmax(210px,1.25fr) repeat(3'), 'Desktop footer must use four columns.');
assert(reportCss.includes('grid-template-columns:repeat(3,minmax(0,1fr))'), 'Tablet footer must use three balanced columns.');
assert(reportJs.includes('facebook.com/ehemehe.lk') && reportJs.includes('instagram.com/ehemehe.lk'), 'Social footer links are not connected.');

assert(reportJs.includes("const FAVORITES_KEY = 'ehemehe:favorites:v2'"), 'Persistent favorite storage key missing.');
assert(reportJs.includes('Remove from favourites'), 'Favorites page remove action missing.');
assert(reportJs.includes("'/dashboard/favorites'"), 'Favorites route repair missing.');
assert(reportJs.includes('ehm-mobile-favorites-link'), 'Mobile favorites navigation item missing.');
assert(reportJs.includes('aria-current'), 'Active mobile navigation state missing.');

assert(reportJs.includes("fetch('/api/update-profile'"), 'Profile Save Changes API connection missing.');
assert(reportJs.includes("fetch('/api/delete-account'"), 'Permanent account deletion connection missing.');
assert(reportJs.includes('+94 7X XXX XXXX'), 'Sri Lankan +94 phone input format missing.');
assert(dispatcher.includes("'/api/update-profile'"), 'Update profile route missing from dispatcher.');
assert(dispatcher.includes("'/api/delete-my-ad'"), 'Delete own ad route missing from dispatcher.');
assert(dispatcher.includes("'/api/delete-account'"), 'Delete account route missing from dispatcher.');

assert(postRuntime.includes("fetch('/api/my-ads?summary=1'"), 'My Ads is not loaded from the authenticated compact account API.');
assert(postRuntime.includes('updateDashboardOverview(rows)'), 'Real My Ads and view-count dashboard statistics missing.');
assert(postRuntime.includes('data-ehm-delete-ad'), 'User ad delete control missing.');
assert(postRuntime.includes("fetch('/api/delete-my-ad'"), 'User ad delete API call missing.');
assert(postRuntime.includes("image || AD_PLACEHOLDER"), 'Dashboard cards do not use the missing-image placeholder.');

assert(filters.includes("typeof images === 'string'"), 'String-encoded ad image arrays are not parsed.');
assert(filters.includes('images.length ? images : [AD_PLACEHOLDER]'), 'Ad detail/list placeholder fallback missing.');
assert(filters.includes("this.src='${AD_PLACEHOLDER}'"), 'Broken image fallback missing.');
assert(filters.includes('target === nativeMain'), 'All ad detail routes are not normalized into one detail layout.');
assert(!filters.includes("if (!isAdRoute() || !ad || ad.source !== 'supabase')"), 'Static and database ads still use competing detail styles.');
assert(filters.includes('input.__ehmLiveSearchTimer'), 'Search-as-you-type debounce missing.');
assert(filters.includes("window.setTimeout(() => renderResults(), 180)"), 'Mobile live search is not enabled.');
assert(filters.includes('ehm-all-categories-back') || reportJs.includes('ehm-all-categories-back'), 'All Categories return control missing.');
assert(!/setInterval\s*\(/.test(reportJs), 'Report fixes must not introduce permanent polling.');

// Verify the +94 normalization logic directly without a browser.
const functionText = reportJs.slice(reportJs.indexOf('function normalizePhone'), reportJs.indexOf('\n\n  async function getClient'));
const context = {};
vm.createContext(context);
vm.runInContext(`${functionText};this.normalizePhone=normalizePhone;`, context);
assert.strictEqual(context.normalizePhone('0771234567'), '+94 77 123 4567');
assert.strictEqual(context.normalizePhone('94771234567'), '+94 77 123 4567');

const placeholder = path.join(root, 'public/assets/ad-placeholder.svg');
assert(fs.existsSync(placeholder) && fs.statSync(placeholder).size > 100, 'Placeholder image asset missing.');

console.log('BUG_REPORT_FULL_REGRESSION_TEST_PASSED');
