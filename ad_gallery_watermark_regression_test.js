const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = __dirname;
const adDetailJs = fs.readFileSync(path.join(root, 'public', 'ad-detail.js'), 'utf8');
const adDetailCss = fs.readFileSync(path.join(root, 'public', 'ad-detail.css'), 'utf8');
const indexFiltersJs = fs.readFileSync(path.join(root, 'public', 'index-filters.js'), 'utf8');
const postAdJs = fs.readFileSync(path.join(root, 'public', 'post-ad.js'), 'utf8');
const postAdRuntimeJs = fs.readFileSync(path.join(root, 'public', 'post-ad-runtime.js'), 'utf8');

assert(adDetailJs.includes('data-gallery-prev') && adDetailJs.includes('data-gallery-next'), 'Desktop ad detail prev/next gallery controls missing');
assert(adDetailJs.includes('touchstart') && adDetailJs.includes('touchend'), 'Desktop ad detail swipe handling missing');
assert(adDetailCss.includes('.gallery-nav') && adDetailCss.includes('.gallery-thumbs'), 'Desktop ad detail gallery styles missing');
assert(indexFiltersJs.includes('data-ehm-detail-prev') && indexFiltersJs.includes('data-ehm-detail-next'), 'Dynamic/mobile ad detail prev/next controls missing');
assert(indexFiltersJs.includes('data-ehm-detail-count') && indexFiltersJs.includes('touchstart') && indexFiltersJs.includes('touchend'), 'Dynamic/mobile ad detail count or swipe handling missing');
assert(postAdJs.includes('applyWatermark') && postAdJs.includes('ehemehe_logo_header.png'), 'Post Ad watermark processing missing');
assert(postAdRuntimeJs.includes('drawWatermarkOnCanvas') && postAdRuntimeJs.includes('ehemehe_logo_header.png'), 'Runtime/edit watermark processing missing');

console.log('AD_GALLERY_WATERMARK_REGRESSION_TEST_PASSED');
