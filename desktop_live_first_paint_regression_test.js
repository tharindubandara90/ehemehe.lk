const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('public/index.html', 'utf8');
const js = fs.readFileSync('public/index-filters.js', 'utf8');

assert(html.includes("document.documentElement.classList.add('ehm-home-live-prepaint')"), 'desktop home must mask bundled recommendation cards before first paint');
assert(html.includes("window.__ehmHomeLivePrepaintObserver = observer"), 'prepaint observer must protect React first mount');
assert(js.includes("HOME_LIVE_SNAPSHOT_KEY = 'ehemehe:desktopHomeLiveSnapshot:v1'"), 'last successful live home snapshot must be cached');
assert(js.includes('hydrateHomeSnapshotCache();'), 'live snapshot must hydrate synchronously before the first recommendation render');
assert(js.includes('renderDesktopRecommendationsPending'), 'first visit must use final-size skeleton cards instead of bundled demo ads');
assert(js.includes('primeDesktopHomeData();'), 'live home requests must start before DOMContentLoaded');
assert(js.includes('if (!desktopLiveDataSettled && !homeSnapshotHydrated)'), 'bundled cards must not be painted while live data is pending');
assert(js.includes("document.documentElement.classList.remove('ehm-home-live-prepaint')"), 'prepaint mask must be released by the managed recommendations renderer');
assert(!js.includes('finally(() => { desktopDataPromise = null; })'), 'desktop data request must not restart on every observer sync');

console.log('Desktop live first-paint regression checks passed.');
