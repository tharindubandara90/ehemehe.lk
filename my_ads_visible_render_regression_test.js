'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const runtime = fs.readFileSync(path.join(__dirname, 'public/post-ad-runtime.js'), 'utf8');
const reportCss = fs.readFileSync(path.join(__dirname, 'public/report-fixes.css'), 'utf8');
const bundle = fs.readFileSync(path.join(__dirname, 'public/js/index-BsKly-Vj.js'), 'utf8');
assert(!reportCss.includes('body.ehm-dashboard-ads-route [data-yw="c3JjL3BhZ2VzL0Rhc2hib2FyZFBhZ2UudHN4QDEzNzoxNg"]{display:none!important}'),
  'Report fixes CSS must not permanently hide the native My Ads mount.');
assert(reportCss.includes('body.ehm-dashboard-ads-route #ehm-real-my-ads'),
  'Managed My Ads mount needs an explicit visible CSS override.');
assert(reportCss.includes('display:flex!important;flex-direction:column!important'),
  'Managed My Ads visibility/layout override is incomplete.');
assert(reportCss.includes('Loading your ads…') && reportCss.includes('No ads submitted yet'),
  'The My Ads mount has no deterministic loading and settled-empty states.');
assert(runtime.includes('const nativeList = document.querySelector'), 'My Ads panel must anchor to the exact native list marker');
assert(runtime.includes("nativeList.id = 'ehm-real-my-ads'"), 'The native My Ads list must be reused as the permanent managed mount point');
assert(runtime.includes("nativeList.removeAttribute('hidden')"), 'The native My Ads list must always be restored to a visible state');
assert(!runtime.includes('nativeList.hidden = true'), 'My Ads must never hide the native list and depend on a removable sibling panel');
const ensureStart = runtime.indexOf('function ensureDashboardAdsPanel()');
const ensureEnd = runtime.indexOf('\n  function refreshDashboardAds', ensureStart);
const ensureBlock = runtime.slice(ensureStart, ensureEnd);
assert(!ensureBlock.includes("main.querySelectorAll('.space-y-4')"), 'My Ads must not hide lists through the global main element');
assert(!ensureBlock.includes("myAdsHeading.closest('main')"), 'My Ads panel must not be appended after the whole dashboard main');
assert(ensureBlock.includes('window.__EHM_REACT_DASHBOARD_ADS !== true'),
  'Legacy innerHTML painting is not disabled when React owns the My Ads children.');
assert(bundle.includes('children:v.map('), 'The React My Ads list is not rendered from authenticated state.');
assert(bundle.includes('window.__EHM_REACT_DASHBOARD_ADS=!0'),
  'React does not declare ownership of the My Ads mount.');

console.log('My Ads visible React render regression passed.');
