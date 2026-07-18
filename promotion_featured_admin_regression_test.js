const fs = require('fs');
const assert = require('assert');
const vm = require('vm');
const { normalizeAd } = require('./lib/public-ads-utils');

const publicJs = fs.readFileSync('public/index-filters.js','utf8');
const adminJs = fs.readFileSync('public/admin.js','utf8');
const adminNested = fs.readFileSync('public/admin/admin.js','utf8');
const css = fs.readFileSync('public/brand-theme.css','utf8');

const normalizedFeatured = normalizeAd({id:'f1',title:'Featured',status:'approved',is_featured:true,promotion_type:'featured'});
const normalizedPromoted = normalizeAd({id:'p1',title:'Promoted',status:'approved',is_promoted:true,promotion_type:'promoted'});
assert.strictEqual(normalizedFeatured.featured,true,'Server normalization lost is_featured');
assert.strictEqual(normalizedPromoted.promoted,true,'Server normalization lost is_promoted');
assert.strictEqual(normalizedFeatured.promotionType,'featured','Featured promotion type missing');
assert.strictEqual(normalizedPromoted.promotionType,'promoted','Promoted promotion type missing');

assert(publicJs.includes('function sortAdsForPlacement(rows)'), 'Placement-aware public sorting missing');
assert(publicJs.includes("const homeUnfiltered = !hasActiveFilters()"), 'Home promoted placement context missing');
assert(publicJs.includes('const categoryActive = !!state.category'), 'Category featured placement context missing');
assert(publicJs.includes('return bPromoted - aPromoted'), 'Promoted ads are not prioritized on home');
assert(publicJs.includes('return bFeatured - aFeatured'), 'Featured ads are not prioritized in category results');
assert(publicJs.includes('function renderDesktopHomeRecommendations()'), 'Desktop live Fresh recommendations renderer missing');
assert(publicJs.includes("heading.textContent = 'Fresh recommendations'"), 'Desktop heading changed from Fresh recommendations');
assert(css.includes('Admin-managed promoted/featured ads inside'), 'Desktop live card dimension-preserving CSS missing');
assert(css.includes('aspect-ratio: 16 / 9 !important'), 'Fresh recommendations image ratio changed');

// Execute the actual public sort functions in isolation.
const sortStart = publicJs.indexOf('  function isPromotedPlacement(ad)');
const sortEnd = publicJs.indexOf('  function getDistrictCities(district)', sortStart);
assert(sortStart >= 0 && sortEnd > sortStart, 'Could not isolate public promotion sort implementation');
const sortContext = {
  state: { category: null },
  hasActiveFilters: () => false,
  topPromotionForAd: () => null,
  allAds: () => [], adMatchesSearch: () => true, adMatchesLocation: () => true, adMatchesCategory: () => true
};
vm.createContext(sortContext);
vm.runInContext(publicJs.slice(sortStart, sortEnd), sortContext);
let sorted = sortContext.sortAdsForPlacement([
  {id:'new-normal',postedAt:'2026-07-18T10:00:00Z'},
  {id:'old-promoted',postedAt:'2026-07-01T10:00:00Z',isPromoted:true}
]);
assert.strictEqual(sorted[0].id,'old-promoted','Home must put promoted ads before newer normal ads');
sortContext.state.category = {id:'vehicles'};
sortContext.hasActiveFilters = () => true;
sorted = sortContext.sortAdsForPlacement([
  {id:'new-promoted',postedAt:'2026-07-18T10:00:00Z',isPromoted:true},
  {id:'old-featured',postedAt:'2026-07-01T10:00:00Z',isFeatured:true},
  {id:'new-normal',postedAt:'2026-07-19T10:00:00Z'}
]);
assert.strictEqual(sorted[0].id,'old-featured','Category must put featured ads before promoted/normal ads');

assert(adminJs.includes('Featured Ad — top of its category'), 'Admin Featured option missing');
assert(adminJs.includes('Promoted Ad — top of home page'), 'Admin Promoted option missing');
assert(adminJs.includes("is_featured:placement === 'featured'"), 'Admin does not save is_featured');
assert(adminJs.includes("is_promoted:placement === 'promoted'"), 'Admin does not save is_promoted');
assert(adminJs.includes('function previewAd(id,event)'), 'Admin preview action missing');
assert(adminJs.includes('data-admin-preview-id'), 'Admin cards are not previewable by click');
assert(adminJs.includes('function removeEditAdImage(index)'), 'Admin image removal action missing');
assert(adminJs.includes("image_url:images[0] || null, images"), 'Admin image removals are not persisted');
assert.strictEqual(adminJs,adminNested,'Duplicate admin implementations are no longer synchronized');

// Execute the actual admin image helpers and preview renderer in isolation.
const helperStart = adminJs.indexOf('function adImages(a){');
const helperEnd = adminJs.indexOf('function catNameById(id){', helperStart);
assert(helperStart >= 0 && helperEnd > helperStart, 'Could not isolate admin image/preview helpers');
const elements = { editImage:{value:''}, editImagesList:{innerHTML:''} };
let previewBody = '';
const adminContext = {
  EDIT_AD_IMAGES: [],
  ADS: [],
  el: (id) => elements[id] || null,
  html: (v) => String(v ?? ''),
  toast: () => {},
  document: { getElementById: () => ({}) },
  openModal: (_title, body) => { previewBody = body; },
  adCategoryName: () => 'Vehicles', adCityName: () => 'Kandy', money: (v) => `LKR ${v}`
};
vm.createContext(adminContext);
vm.runInContext(adminJs.slice(helperStart, helperEnd), adminContext);
assert.deepStrictEqual(Array.from(adminContext.adImages({image_url:'one.jpg',images:['one.jpg','two.jpg']})),['one.jpg','two.jpg'],'Admin image parsing must deduplicate images');
adminContext.EDIT_AD_IMAGES = ['one.jpg','two.jpg'];
adminContext.removeEditAdImage(0);
assert.deepStrictEqual(Array.from(adminContext.EDIT_AD_IMAGES),['two.jpg'],'Removing an admin image must update the saved image list');
elements.editImage.value = 'three.jpg';
assert.deepStrictEqual(Array.from(adminContext.editAdImagesWithPendingUrl()),['three.jpg','two.jpg'],'New image and remaining images must persist in order');
assert.strictEqual(adminContext.adPlacement({is_featured:true}),'featured','Featured admin state detection failed');
assert.strictEqual(adminContext.adPlacement({is_promoted:true}),'promoted','Promoted admin state detection failed');
adminContext.ADS = [{id:'a1',title:'Preview Me',description:'Description',price:100,images:['one.jpg'],status:'approved',is_featured:true}];
adminContext.previewAd('a1');
assert(previewBody.includes('Preview Me') && previewBody.includes('Featured Ad'),'Admin card preview did not render listing content and placement');

console.log('PROMOTION_FEATURED_ADMIN_REGRESSION_TEST_PASSED');
