const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const filters = fs.readFileSync(path.join(root, 'public', 'index-filters.js'), 'utf8');
const publicAd = fs.readFileSync(path.join(root, 'api-handlers', 'public-ad.js'), 'utf8');
const publicHome = fs.readFileSync(path.join(root, 'api-handlers', 'public-home.js'), 'utf8');
const publicAds = fs.readFileSync(path.join(root, 'api-handlers', 'public-ads.js'), 'utf8');
const utilsSource = fs.readFileSync(path.join(root, 'lib', 'public-ads-utils.js'), 'utf8');

assert(filters.includes("return path === '/search';"), 'All Ads /search route is not detected.');
assert(filters.includes('ensureLiveSearchPage'), 'All Ads route is not replaced with live listings.');
assert(filters.includes('renderLiveSearchPage'), 'Live All Ads renderer is missing.');
assert(filters.includes('loadAds(true)'), 'All Ads/category routes do not force fresh data.');
assert(filters.includes('normalizeLivePublicAds'), 'Browser fallback does not apply compatible public-status filtering.');
assert(filters.includes('resolveAdCategoryFromLookups'), 'UUID category resolution is missing in the browser fallback.');
assert(filters.includes(".from('ads')\n        .select('*')\n        .eq('id', cleanId)"), 'Direct UUID ad fallback is missing.');
assert(filters.includes("cache: 'no-store'"), 'Direct public requests can still use stale browser cache.');
assert(filters.includes('const key = id ? `id:${id}`'), 'Ads are still incorrectly deduplicated by title/price/location.');
assert(publicAd.includes("Vercel-CDN-Cache-Control', 'no-store"), 'Direct ad endpoint can still return a stale CDN response.');
for (const source of [publicHome, publicAds]) {
  assert(source.includes("Vercel-CDN-Cache-Control', 'no-store"), 'Public listing endpoint is not live/no-store.');
}
assert(!utilsSource.includes("params.set('status', 'eq.approved')"), 'Server query is still locked to one lowercase status.');
assert(!utilsSource.includes("params.set('created_at', `gte.${expiryCutoffIso()}`)"), 'Server query is still locked to a created_at filter.');
assert(utilsSource.includes("PUBLIC_STATUS_VALUES = new Set(['approved', 'active', 'published', 'live'])"), 'Compatible public status values are missing.');
assert(utilsSource.includes('filterPublicRows'), 'Server-side public status/expiry filter is missing.');

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

  const now = Date.now();
  const rows = [
    { id: 'new-approved', title: 'Newest Approved', status: 'Approved', created_at: new Date(now - 1000).toISOString(), custom_fields: { category_slug: 'vehicles', subcategory_slug: 'suvs' } },
    { id: 'new-active', title: 'Newest Active', status: 'active', created_at: new Date(now - 2000).toISOString(), custom_fields: { category_slug: 'electronics' } },
    { id: 'pending', title: 'Pending Hidden', status: 'pending', created_at: new Date(now - 500).toISOString(), custom_fields: {} },
    { id: 'rejected', title: 'Rejected Hidden', status: 'rejected', created_at: new Date(now - 500).toISOString(), custom_fields: {} },
    { id: 'expired', title: 'Expired Hidden', status: 'approved', created_at: new Date(now - 30 * 86400000).toISOString(), custom_fields: {} },
    { id: 'legacy-public', title: 'Legacy Public', created_at: new Date(now - 3000).toISOString(), custom_fields: {} }
  ];
  const calls = [];
  global.fetch = async (url) => {
    const value = String(url);
    calls.push(value);
    if (value.includes('/rest/v1/categories?')) {
      return { ok: true, status: 200, text: async () => '[]' };
    }
    if (value.includes('/rest/v1/ads?')) {
      const parsed = new URL(value);
      const idFilter = parsed.searchParams.get('id');
      const payload = idFilter ? rows.filter((row) => `eq.${row.id}` === idFilter) : rows;
      return { ok: true, status: 200, text: async () => JSON.stringify(payload) };
    }
    return { ok: true, status: 200, text: async () => '[]' };
  };

  try {
    const modulePath = require.resolve('./lib/public-ads-utils');
    delete require.cache[modulePath];
    const api = require('./lib/public-ads-utils');
    const visible = await api.queryAds({ limit: 100, approvedOnly: true });
    assert.deepStrictEqual(visible.map((row) => row.id), ['new-approved', 'new-active', 'legacy-public']);
    const direct = await api.queryAds({ id: 'new-approved', approvedOnly: true });
    assert.strictEqual(direct.length, 1, 'Direct approved UUID lookup failed.');
    const pending = await api.queryAds({ id: 'pending', approvedOnly: true });
    assert.strictEqual(pending.length, 0, 'Pending ad leaked into public detail.');
    assert(calls.every((url) => !url.includes('status=eq.approved')), 'A request still uses the brittle status=eq.approved filter.');
    assert(calls.every((url) => !url.includes('created_at=gte.')), 'A request still uses the brittle created_at cutoff filter.');

    // Old schemas can be missing created_at/status and must still return legacy
    // public rows instead of turning every public page into 0 results.
    let compatibilityAttempts = 0;
    global.fetch = async (url) => {
      const value = String(url);
      if (value.includes('/rest/v1/categories?')) return { ok: true, status: 200, text: async () => '[]' };
      if (!value.includes('/rest/v1/ads?')) return { ok: true, status: 200, text: async () => '[]' };
      compatibilityAttempts += 1;
      const select = new URL(value).searchParams.get('select') || '';
      if (select.includes('created_at') || select.includes('status')) {
        return { ok: false, status: 400, text: async () => JSON.stringify({ code: 'PGRST204', message: 'column is missing from schema cache' }) };
      }
      return { ok: true, status: 200, text: async () => JSON.stringify([{ id: 'legacy-schema-ad', title: 'Legacy Schema Ad', price: 1000, custom_fields: { category_slug: 'vehicles' } }]) };
    };
    delete require.cache[modulePath];
    const compatibilityApi = require('./lib/public-ads-utils');
    const compatibilityRows = await compatibilityApi.queryAds({ limit: 10, approvedOnly: true });
    assert.strictEqual(compatibilityRows.length, 1, 'Missing created_at/status schema fallback returned no ads.');
    assert.strictEqual(compatibilityRows[0].id, 'legacy-schema-ad');
    assert(compatibilityAttempts > 1, 'Schema fallback was not exercised.');
  } finally {
    global.fetch = oldFetch;
    for (const [key, value] of Object.entries(oldEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }

  console.log('PUBLIC_LISTING_ROOT_REGRESSION_TEST_PASSED');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
