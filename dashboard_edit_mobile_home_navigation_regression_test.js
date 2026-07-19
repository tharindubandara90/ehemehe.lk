const assert = require('assert');
const fs = require('fs');

const runtime = fs.readFileSync('public/post-ad-runtime.js', 'utf8');
const filters = fs.readFileSync('public/index-filters.js', 'utf8');
const index = fs.readFileSync('public/index.html', 'utf8');

const nativeEditMarker = 'c3JjL3BhZ2VzL0Rhc2hib2FyZFBhZ2UudHN4QDE0NzoyNA';
const nativeCardMarker = 'c3JjL3BhZ2VzL0Rhc2hib2FyZFBhZ2UudHN4QDEzOToyMA';

assert(runtime.includes(`NATIVE_DASHBOARD_EDIT_MARKER = '${nativeEditMarker}'`),
  'The original dashboard pencil button is not targeted.');
assert(runtime.includes(`NATIVE_DASHBOARD_CARD_MARKER = '${nativeCardMarker}'`),
  'The original My Ads card is not targeted.');
assert(runtime.includes('async function openNativeDashboardEdit(button)'),
  'The native dashboard edit fallback is missing.');
assert(runtime.includes('await loadDashboardAds(true)'),
  'Native edit does not refresh the signed-in user ads before matching.');
assert(runtime.includes('matchNativeDashboardAd(card, ads)'),
  'Native cards are not matched to the real signed-in user ad.');
assert(runtime.includes("fetch('/api/update-my-ad'"),
  'The edit form is not connected to the protected update endpoint.');
assert(runtime.includes('event.stopPropagation();'),
  'Dashboard edit clicks are not isolated from the surrounding card.');

assert(filters.includes('function mobileHomeNavigationLink(target)'),
  'Mobile Home navigation detection is missing.');
assert(filters.includes("window.location.assign('/')"),
  'Mobile bottom-navigation Home does not perform a clean home navigation.');
assert(filters.includes('function scheduleMobileHomeRecovery()'),
  'SPA/back-navigation recovery for mobile home is missing.');
assert(filters.includes('[0, 60, 160, 350, 700, 1200]'),
  'Mobile home recovery must be bounded and must not use permanent polling.');
assert(!/setInterval\s*\(/.test(filters),
  'The fix must not add a permanent polling loop.');
assert(index.includes('/index-filters.js?v='),
  'The fixed mobile navigation script is not loaded by the app shell.');

console.log('Dashboard edit + mobile Home navigation regression test passed.');
