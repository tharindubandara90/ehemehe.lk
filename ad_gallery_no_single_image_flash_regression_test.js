const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = __dirname;
const js = fs.readFileSync(path.join(root, 'public', 'index-filters.js'), 'utf8');

assert(js.includes('function isCompleteDetailAd(ad)'), 'Complete-detail cache guard is missing');
assert(js.includes('if (isCompleteDetailAd(instantAd)) renderDynamicAdDetail(instantAd);'), 'Incomplete one-thumbnail cache can still render immediately');
assert(js.includes('cachePublicDetailAd(selected, { complete: false })'), 'Listing-card cache is not explicitly marked incomplete');
assert(js.includes('cachePublicDetailAd(normalized, { complete: true })'), 'Detail API result is not explicitly marked complete');
assert(js.includes('normalized.detailComplete = true'), 'Authoritative detail response completeness marker missing');
assert(js.includes('detailComplete: false') && js.includes('_detailComplete: false'), 'Trimmed session cache is not marked incomplete');
assert(js.includes('temporary 1/1 gallery'), 'Regression rationale marker missing');

console.log('AD_GALLERY_NO_SINGLE_IMAGE_FLASH_REGRESSION_TEST_PASSED');
