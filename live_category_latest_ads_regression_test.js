const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const filters = fs.readFileSync(path.join(root, 'public', 'index-filters.js'), 'utf8');
const postAd = fs.readFileSync(path.join(root, 'public', 'post-ad.js'), 'utf8');
const publicHome = fs.readFileSync(path.join(root, 'api-handlers', 'public-home.js'), 'utf8');
const publicAds = fs.readFileSync(path.join(root, 'api-handlers', 'public-ads.js'), 'utf8');

assert(filters.includes("path.match(/^\\/category\\/([^/]+)$/i)"), 'Category route detection is missing.');
assert(filters.includes('ensureLiveCategoryPage'), 'Live category page renderer is missing.');
assert(filters.includes('loadAds(true)'), 'Category pages do not force a fresh approved-ad request.');
assert(filters.includes("{ id: 'suvs', name: 'SUVs' }"), 'SUV category is missing from the public vehicle taxonomy.');
assert(filters.includes("{ id: 'lorries', name: 'Lorries' }"), 'Lorries category is missing from the public vehicle taxonomy.');
assert(filters.includes("{ id: 'heavy-equipment', name: 'Heavy Equipment' }"), 'Heavy Equipment category is missing from the public vehicle taxonomy.');
assert(filters.includes("cache: 'no-store'"), 'Home/category requests are not bypassing stale browser cache.');
assert(filters.includes("if (categoryRouteDataKey === routeSlug && adsLoaded)"), 'Category mutation retries can still restart the live request loop.');

assert(postAd.includes('category_slug:categorySlug'), 'Direct Post Ad flow does not persist the parent category slug.');
assert(postAd.includes('subcategory_slug:subcategorySlug'), 'Direct Post Ad flow does not persist the subcategory slug.');
assert(postAd.includes('submitted_at:new Date().toISOString()'), 'Direct Post Ad flow does not persist submission time metadata.');

for (const source of [publicHome, publicAds]) {
  assert(source.includes("Cache-Control', 'no-store"), 'Public listing endpoint can still serve stale CDN/browser data.');
  assert(source.includes("Vercel-CDN-Cache-Control', 'no-store"), 'Vercel CDN cache is not explicitly disabled for live listings.');
}

(async () => {
  const oldFetch = global.fetch;
  const oldEnv = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
  };
  process.env.SUPABASE_URL = 'https://project.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';

  const parentId = '11111111-1111-4111-8111-111111111111';
  const childId = '22222222-2222-4222-8222-222222222222';
  const now = new Date().toISOString();
  const calls = [];

  global.fetch = async (url) => {
    const value = String(url);
    calls.push(value);
    let payload = [];
    if (value.includes('/rest/v1/ads?')) {
      payload = [{
        id: 'ad-new-1',
        title: 'Toyota Land Cruiser',
        description: 'Recently approved SUV',
        price: 4345435,
        category_id: childId,
        status: 'approved',
        created_at: now,
        custom_fields: {}
      }];
    } else if (value.includes('/rest/v1/categories?')) {
      payload = [
        { id: parentId, name: 'Vehicles', slug: 'vehicles', parent_id: null, is_active: true },
        { id: childId, name: 'SUVs', slug: 'suvs', parent_id: parentId, is_active: true }
      ];
    }
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify(payload)
    };
  };

  try {
    const modulePath = require.resolve('./lib/public-ads-utils');
    delete require.cache[modulePath];
    const api = require('./lib/public-ads-utils');
    const rows = await api.queryAds({ limit: 10, approvedOnly: true });
    assert.strictEqual(rows.length, 1, 'Fresh approved ad was not returned.');
    assert.strictEqual(rows[0]._category_slug, 'vehicles', 'Parent category slug was not resolved from the UUID.');
    assert.strictEqual(rows[0]._subcategory_slug, 'suvs', 'Subcategory slug was not resolved from the UUID.');
    const ad = api.normalizeAd(rows[0], false);
    assert.strictEqual(ad.categoryId, 'vehicles', 'Public ad category does not match the Vehicles page.');
    assert.strictEqual(ad.subcategoryId, 'suvs', 'Public ad subcategory does not match the SUVs filter.');
    assert(calls.some((url) => url.includes('/rest/v1/categories?')), 'Category lookup was never requested.');
  } finally {
    global.fetch = oldFetch;
    Object.entries(oldEnv).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  }

  console.log('LIVE_CATEGORY_LATEST_ADS_REGRESSION_TEST_PASSED');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
