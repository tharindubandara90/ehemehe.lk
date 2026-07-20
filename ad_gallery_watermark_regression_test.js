const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { normalizeAd } = require('./lib/public-ads-utils');

const root = __dirname;
const adDetailJs = fs.readFileSync(path.join(root, 'public', 'ad-detail.js'), 'utf8');
const adDetailCss = fs.readFileSync(path.join(root, 'public', 'ad-detail.css'), 'utf8');
const indexFiltersJs = fs.readFileSync(path.join(root, 'public', 'index-filters.js'), 'utf8');
const postAdJs = fs.readFileSync(path.join(root, 'public', 'post-ad.js'), 'utf8');
const postAdRuntimeJs = fs.readFileSync(path.join(root, 'public', 'post-ad-runtime.js'), 'utf8');
const publicAdHandler = fs.readFileSync(path.join(root, 'api-handlers', 'public-ad.js'), 'utf8');
const publishAdHandler = fs.readFileSync(path.join(root, 'api-handlers', 'publish-ad.js'), 'utf8');

assert(adDetailJs.includes('data-gallery-prev') && adDetailJs.includes('data-gallery-next'), 'Desktop ad detail prev/next gallery controls missing');
assert(adDetailJs.includes('touchstart') && adDetailJs.includes('touchend'), 'Desktop ad detail swipe handling missing');
assert(adDetailCss.includes('.gallery-nav') && adDetailCss.includes('.gallery-thumbs'), 'Desktop ad detail gallery styles missing');
assert(indexFiltersJs.includes('data-ehm-detail-prev') && indexFiltersJs.includes('data-ehm-detail-next'), 'Dynamic/mobile ad detail prev/next controls missing');
assert(indexFiltersJs.includes('data-ehm-detail-count') && indexFiltersJs.includes('touchstart') && indexFiltersJs.includes('touchend'), 'Dynamic/mobile ad detail count or swipe handling missing');
assert(indexFiltersJs.includes('/api/public-ad?id=') && indexFiltersJs.includes('complete photo'), 'Ad route does not refresh the complete gallery from the detail API');
assert(publicAdHandler.includes('queryAdImageCount') && publicAdHandler.includes('_image_count'), 'Public ad endpoint does not resolve the complete stored image count');
assert(publishAdHandler.includes('image_count: images.length'), 'New ads do not persist image count metadata');

const normalized = normalizeAd({
  id: 'gallery-test',
  title: 'Gallery Test',
  custom_fields: { image_count: 5 }
}, true);
assert.strictEqual(normalized.images.length, 5, 'Detail normalization must create one proxy URL per stored image');
assert(normalized.images[4].includes('index=4'), 'Fifth gallery proxy URL missing');

const postWatermark = postAdJs.slice(postAdJs.indexOf('async function applyWatermark'), postAdJs.indexOf('async function simpleCompressImage'));
const runtimeWatermark = postAdRuntimeJs.slice(postAdRuntimeJs.indexOf('async function drawWatermarkOnCanvas'), postAdRuntimeJs.indexOf('async function optimizedImage'));
assert(postWatermark.includes('globalAlpha=0.16') && postWatermark.includes('(w-logoWidth)/2'), 'Post Ad watermark is not centered and lightly transparent');
assert(runtimeWatermark.includes('globalAlpha = 0.16') && runtimeWatermark.includes('(width - logoWidth) / 2'), 'Runtime watermark is not centered and lightly transparent');
assert(!postWatermark.includes('fillStyle') && !postWatermark.includes('arcTo'), 'Post Ad watermark still draws a white badge');
assert(!runtimeWatermark.includes('fillStyle') && !runtimeWatermark.includes('arcTo'), 'Runtime watermark still draws a white badge');
assert(postAdJs.includes('ehemehe_logo_header.png') && postAdRuntimeJs.includes('ehemehe_logo_header.png'), 'Transparent EheMehe logo asset is not used');

console.log('AD_GALLERY_WATERMARK_REGRESSION_TEST_PASSED');
