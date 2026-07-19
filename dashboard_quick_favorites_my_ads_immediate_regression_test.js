const assert = require('assert');
const fs = require('fs');
const { EventEmitter } = require('events');

const report = fs.readFileSync('public/report-fixes.js', 'utf8');
const runtime = fs.readFileSync('public/post-ad-runtime.js', 'utf8');

assert(report.includes("'view favorites': '/dashboard/favorites'"),
  'Dashboard View Favorites quick action is not mapped to the Favorites route.');
assert(runtime.includes("const DASHBOARD_ADS_CACHE_PREFIX = 'ehemehe:myAdsCache:v2:'"),
  'My Ads has no user-specific immediate cache.');
assert(runtime.includes('function ensureDashboardAdsPanel()'),
  'My Ads loading/list panel is not created immediately on /dashboard/ads.');
assert(runtime.includes("fetch('/api/my-ads?summary=1'"),
  'My Ads does not request the compact summary endpoint.');
assert(runtime.includes('hydrateDashboardAdsCache(authSession.user.id)'),
  'My Ads cache is not hydrated as soon as auth is ready.');
assert(runtime.includes('`/api/ad-image?id=${encodeURIComponent(remoteId)}&index=0`'),
  'My Ads images are not lazy-loaded through the image endpoint.');
assert(!/setInterval\s*\(/.test(runtime), 'My Ads speed fix introduced permanent polling.');

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
  req.headers = { authorization: 'Bearer fast-token' };
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

  const calls = [];
  global.fetch = async (url) => {
    calls.push(String(url));
    if (String(url).endsWith('/auth/v1/user')) return jsonResponse(true, { id: 'user-fast-2' });
    if (String(url).includes('/rest/v1/ads?')) {
      const decoded = decodeURIComponent(String(url));
      assert(decoded.includes('user_id=eq.user-fast-2'), 'My Ads query is not filtered server-side by user.');
      assert(!decoded.includes('select=*'), 'Fast My Ads path still downloads full rows.');
      assert(!decoded.includes('images') && !decoded.includes('image_url'),
        'Fast My Ads path still downloads heavy image columns.');
      return jsonResponse(true, [{
        id: 'owned-fast-2', user_id: 'user-fast-2', title: 'Fast dashboard ad', price: 1000,
        status: 'approved', created_at: '2026-07-19T00:00:00Z', custom_fields: {}
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
  assert.strictEqual(payload.ads.length, 1);
  assert.strictEqual(payload.ads[0].image_url, '/api/ad-image?id=owned-fast-2&index=0');
  assert.strictEqual(calls.filter((url) => url.includes('/rest/v1/ads?')).length, 1,
    'Fast My Ads path made unnecessary schema retries.');

  global.fetch = oldFetch;
  for (const [key, value] of Object.entries(oldEnv)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
  console.log('Dashboard quick Favorites + immediate compact My Ads regression test passed.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
