'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const runtime = fs.readFileSync(path.join(__dirname, 'public/post-ad-runtime.js'), 'utf8');
const reportCss = fs.readFileSync(path.join(__dirname, 'public/report-fixes.css'), 'utf8');
assert(!reportCss.includes('body.ehm-dashboard-ads-route [data-yw="c3JjL3BhZ2VzL0Rhc2hib2FyZFBhZ2UudHN4QDEzNzoxNg"]{display:none!important}'),
  'Report fixes CSS must not permanently hide the native My Ads mount.');
assert(reportCss.includes('body.ehm-dashboard-ads-route #ehm-real-my-ads'),
  'Managed My Ads mount needs an explicit visible CSS override.');
assert(reportCss.includes('[data-ehm-dashboard-list="managed"]{display:flex!important;visibility:visible!important;opacity:1!important}'),
  'Managed My Ads visibility override is incomplete.');
assert(runtime.includes('const nativeList = document.querySelector'), 'My Ads panel must anchor to the exact native list marker');
assert(runtime.includes("nativeList.id = 'ehm-real-my-ads'"), 'The native My Ads list must be reused as the permanent managed mount point');
assert(runtime.includes("nativeList.removeAttribute('hidden')"), 'The native My Ads list must always be restored to a visible state');
assert(!runtime.includes("nativeList.hidden = true"), 'My Ads must never hide the native list and depend on a removable sibling panel');
const ensureStart = runtime.indexOf('function ensureDashboardAdsPanel()');
const ensureEnd = runtime.indexOf('\n  async function renderDashboard()', ensureStart);
const ensureBlock = runtime.slice(ensureStart, ensureEnd);
assert(!ensureBlock.includes("main.querySelectorAll('.space-y-4')"), 'My Ads must not hide lists through the global main element');
assert(!ensureBlock.includes("myAdsHeading.closest('main')"), 'My Ads panel must not be appended after the whole dashboard main');
assert(runtime.includes("managedContentPresent"), 'React child replacement must force managed My Ads content to repaint');

console.log('My Ads visible render regression passed.');
