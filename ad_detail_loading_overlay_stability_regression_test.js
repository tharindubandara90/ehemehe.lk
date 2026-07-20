const fs = require('fs');
const path = require('path');
const assert = require('assert');

const source = fs.readFileSync(path.join(__dirname, 'public', 'index-filters.js'), 'utf8');

assert(source.includes('function renderedDetailMatchesCurrentRoute()'), 'Rendered-detail route guard is missing');
assert(source.includes('host.dataset.ehmRenderedAdId'), 'Rendered ad route ID is not stored on the detail host');
assert(source.includes('if ((!expectedId || expectedId === currentId) && renderedDetailMatchesCurrentRoute())'), 'Loading shell is not guarded after the current ad has rendered');
assert(source.includes('finishDynamicDetailPending();\n      return false;'), 'Stable detail guard does not immediately cancel the loading shell');
assert(source.includes('function setDetailAdCacheEntry(ad)'), 'Detail cache downgrade guard is missing');
assert(source.includes('if (detailAdIsComplete(existing) && !detailAdIsComplete(ad)) return existing;'), 'Complete gallery can still be overwritten by a thumbnail-only list response');

const cacheBlockStart = source.indexOf('  function detailAdIsComplete(ad)');
const cacheBlockEnd = source.indexOf('  function persistHomeSnapshotCache()', cacheBlockStart);
assert(cacheBlockStart >= 0 && cacheBlockEnd > cacheBlockStart, 'Could not isolate detail cache helper functions');
const cacheBlock = source.slice(cacheBlockStart, cacheBlockEnd);
const detailAdCache = new Map();
const helpers = new Function('detailAdCache', `${cacheBlock}\nreturn { detailAdIsComplete, setDetailAdCacheEntry };`)(detailAdCache);

const complete = {
  id: 'ed3946a4-914b-459c-bce5-00affad6d228',
  images: ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg'],
  detailComplete: true,
  _detailComplete: true
};
const thumbnailOnly = {
  id: complete.id,
  images: ['thumb.jpg'],
  detailComplete: false,
  _detailComplete: false
};
helpers.setDetailAdCacheEntry(complete);
const retained = helpers.setDetailAdCacheEntry(thumbnailOnly);
assert.strictEqual(retained, complete, 'Thumbnail response replaced the complete gallery cache');
assert.strictEqual(detailAdCache.get(complete.id).images.length, 5, 'Complete gallery image list was downgraded');

const beginStart = source.indexOf('  function beginDynamicDetailPending(expectedAdId');
const addClassAt = source.indexOf("document.documentElement?.classList?.add('ehm-ad-detail-pending')", beginStart);
const guardAt = source.indexOf('renderedDetailMatchesCurrentRoute()', beginStart);
assert(beginStart >= 0 && guardAt > beginStart && addClassAt > guardAt, 'Pending class is added before checking whether the ad is already rendered');


const syncRouteStart = source.indexOf('      if (isAdRoute()) {', source.indexOf('async function sync()'));
const syncInstantAt = source.indexOf('const instantAd = readPublicDetailAd(currentRouteAdId())', syncRouteStart);
const syncPendingAt = source.indexOf('beginDynamicDetailPending();', syncRouteStart);
assert(syncRouteStart >= 0 && syncInstantAt > syncRouteStart && syncPendingAt > syncInstantAt, 'Ad sync creates the loading shell before checking the complete detail cache');

console.log('AD_DETAIL_LOADING_OVERLAY_STABILITY_REGRESSION_TEST_PASSED');
