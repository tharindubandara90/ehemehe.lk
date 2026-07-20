'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const { EventEmitter } = require('events');

const runtime = fs.readFileSync('public/post-ad-runtime.js', 'utf8');
const bundle = fs.readFileSync('public/js/index-BsKly-Vj.js', 'utf8');
const api = fs.readFileSync('api-handlers/my-ads.js', 'utf8');

assert(!bundle.includes('Ht.slice(0,3)'),
  'The React dashboard still renders the three bundled demo ads in My Ads.');
assert(!bundle.includes('label:"My Ads",value:"3"'),
  'Overview still flashes the hardcoded My Ads count 3.');
assert(!bundle.includes('label:"Views",value:"892"'),
  'Overview still flashes the bundled demo view count.');
assert(bundle.includes('function ehmDashboardAdsState'),
  'The React dashboard has no owner-specific cached My Ads state.');
assert(bundle.includes('window.addEventListener("ehemehe:dashboard-ads-updated"'),
  'React does not subscribe to authenticated My Ads updates.');
assert(bundle.includes('value:v.length.toString()'),
  'The Overview My Ads count is not derived from the real owner rows.');
assert(bundle.includes('"data-ehm-edit-ad":z.id') && bundle.includes('"data-ehm-delete-ad":z.id'),
  'React-rendered owner rows are missing working edit/delete identities.');

const applyStart = runtime.indexOf('function applyLoadedDashboardAds(ads)');
const applyEnd = runtime.indexOf('\n  function refreshDashboardAds', applyStart);
const applyBlock = runtime.slice(applyStart, applyEnd);
assert(applyBlock.includes('window.__EHM_REACT_DASHBOARD_ADS !== true'),
  'The legacy DOM painter can still overwrite React My Ads rows after the API completes.');
assert(runtime.includes("const DASHBOARD_ADS_CACHE_PREFIX = 'ehemehe:myAdsCache:v3:'"),
  'The owner cache version was not advanced after changing the render architecture.');
assert(runtime.includes("const LEGACY_DASHBOARD_ADS_CACHE_PREFIX = 'ehemehe:myAdsCache:v2:'"),
  'Existing owner cache cannot be migrated for an instant first render.');
assert(api.includes('await Promise.all(['),
  'The two supported Supabase ownership layouts are still queried sequentially.');

// Execute the actual helper functions extracted from the production bundle.
const helperStart = bundle.indexOf('function ehmOwnedDashboardAd');
const helperEnd = bundle.indexOf('function ad(){', helperStart);
assert(helperStart >= 0 && helperEnd > helperStart, 'React My Ads helper block was not found.');
const ownerId = 'owner-cache';
const cachedRows = [
  ...Array.from({ length: 16 }, (_, index) => ({
    id: `mine-${index}`,
    title: `Mine ${index}`,
    created_at: `2026-07-${String(index + 1).padStart(2, '0')}T00:00:00Z`,
    view_count: index,
    custom_fields: { owner_user_id: ownerId }
  })),
  ...Array.from({ length: 3 }, (_, index) => ({
    id: `other-${index}`,
    title: `Other ${index}`,
    custom_fields: { owner_user_id: 'another-owner' }
  }))
];
const storage = new Map([
  [`ehemehe:myAdsCache:v2:${ownerId}`, JSON.stringify({ savedAt: Date.now(), ads: cachedRows })]
]);
const context = {
  window: {},
  localStorage: { getItem: (key) => storage.get(key) || null },
  Date, JSON, Array, String, Number, Boolean, encodeURIComponent
};
vm.createContext(context);
vm.runInContext(`${bundle.slice(helperStart, helperEnd)}\nthis.__helpers={ehmDashboardAdsState};`, context);
const cachedState = context.__helpers.ehmDashboardAdsState(ownerId);
assert.strictEqual(cachedState.ads.length, 16,
  'The instant cache did not return all 16 rows owned by the signed-in account.');
assert(cachedState.ads.every((row) => row.custom_fields.owner_user_id === ownerId),
  'Another account can appear in the instant My Ads cache.');
assert.strictEqual(cachedState.settled, true, 'A valid legacy owner cache is not recognized immediately.');
const otherAccount = context.__helpers.ehmDashboardAdsState('another-new-owner');
assert.deepStrictEqual(Array.from(otherAccount.ads), [],
  'Changing accounts can flash the previous account\'s My Ads rows.');

function responseRecorder() {
  let resolve;
  const done = new Promise((r) => { resolve = r; });
  return {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(name, value) { this.headers[String(name).toLowerCase()] = value; },
    end(value = '') { this.body += String(value || ''); resolve(this); },
    done
  };
}

function request() {
  const req = new EventEmitter();
  req.method = 'GET';
  req.body = {};
  req.headers = { authorization: 'Bearer owner-token' };
  req.url = '/api/my-ads?summary=1';
  return req;
}

function jsonResponse(ok, payload, status = ok ? 200 : 400) {
  return { ok, status, json: async () => payload, text: async () => JSON.stringify(payload) };
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

  const adCalls = [];
  global.fetch = async (url) => {
    const value = String(url);
    if (value.endsWith('/auth/v1/user')) return jsonResponse(true, { id: 'owner-1' });
    if (value.includes('/rest/v1/ads?')) {
      adCalls.push(value);
      const parsed = new URL(value);
      const ownerFilter = parsed.searchParams.get('custom_fields->>owner_user_id');
      const directFilter = parsed.searchParams.get('user_id');
      assert(ownerFilter === 'eq.owner-1' || directFilter === 'eq.owner-1',
        'A My Ads database request is not owner-filtered.');
      if (ownerFilter) {
        return jsonResponse(true, [
          {
            id: 'mine-1', title: 'My real ad', price: 1000, status: 'approved',
            created_at: '2026-07-20T00:00:00Z',
            custom_fields: { owner_user_id: 'owner-1', city: 'Kandy' }
          },
          {
            id: 'other-1', title: 'Another user ad', price: 9999, status: 'approved',
            created_at: '2026-07-20T00:00:00Z',
            custom_fields: { owner_user_id: 'owner-2' }
          }
        ]);
      }
      return jsonResponse(true, [{
        id: 'mine-1', user_id: 'owner-1', title: 'My real ad', price: 1000,
        created_at: '2026-07-20T00:00:00Z', custom_fields: { owner_user_id: 'owner-1' }
      }]);
    }
    throw new Error(`Unexpected URL ${url}`);
  };

  delete require.cache[require.resolve('./api-handlers/my-ads')];
  const handler = require('./api-handlers/my-ads');
  const res = responseRecorder();
  await handler(request(), res);
  await res.done;

  const payload = JSON.parse(res.body);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(payload.ads.map((row) => row.id), ['mine-1'],
    'My Ads returned rows not owned by the authenticated user.');
  assert.strictEqual(adCalls.length, 2,
    'The normal path must use exactly two compact owner-filtered queries and no marketplace scan.');

  global.fetch = oldFetch;
  for (const [key, value] of Object.entries(oldEnv)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
  console.log('My Ads React owner-only instant regression test passed.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
