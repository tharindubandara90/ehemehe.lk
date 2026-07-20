const assert = require('assert');
const fs = require('fs');
const { EventEmitter } = require('events');

const report = fs.readFileSync('public/report-fixes.js', 'utf8');
const runtime = fs.readFileSync('public/post-ad-runtime.js', 'utf8');
const authBridge = fs.readFileSync('public/auth-session-bridge.js', 'utf8');
const apiSource = fs.readFileSync('api-handlers/my-ads.js', 'utf8');

assert(report.includes("const HOME_SNAPSHOT_KEY = 'ehemehe:desktopHomeLiveSnapshot:v1'"),
  'Favorites view does not hydrate from the already loaded home snapshot.');
assert(report.includes('Promise.allSettled(['),
  'Favorites public and static ad sources are not fetched in parallel.');
assert(report.includes('paintFavoritesPanel(panel, ids, publicAdsCache, false)'),
  'Favorites view does not paint cached rows before waiting for the network.');
assert(report.includes('Loading favourites…'),
  'Favorites route has no immediate loading state.');
assert(report.includes('const delays = [0, 16, 60, 140, 300, 600]'),
  'Dashboard route transitions are not retried after the React tab DOM changes.');
assert(!/setInterval\s*\(/.test(report), 'Dashboard favorites fix introduced permanent polling.');

assert(runtime.includes('dashboardPromise: null'),
  'My Ads does not share an in-flight request between duplicate dashboard ticks.');
assert(runtime.includes('if (runtime.dashboardPromise) return runtime.dashboardPromise'),
  'Duplicate My Ads calls can still render an empty list while the request is running.');
assert(runtime.includes('window.__EHM_AUTH_SESSION?.user'),
  'My Ads still waits for a second Supabase session lookup even when auth is ready.');
assert(runtime.includes('Loading your ads…'),
  'My Ads has no immediate loading panel.');
assert(runtime.includes("window.addEventListener('ehemehe:auth-ready', prefetchDashboardAds)"),
  'My Ads is not prefetched as soon as the authenticated session is ready.');
assert(authBridge.includes('window.__EHM_AUTH_SESSION = currentSession'),
  'Auth bridge does not expose the ready session to dashboard loaders.');
assert(authBridge.includes('ehemehe:auth-ready'),
  'Auth bridge does not publish a dashboard prefetch event.');
assert(apiSource.includes('await Promise.all(['),
  'Supabase ownership queries are still serialized.');

function responseRecorder() {
  let resolve;
  const done = new Promise((r) => { resolve = r; });
  return {
    statusCode: 200,
    headers: {},
    body: '',
    writableEnded: false,
    setHeader(name, value) { this.headers[String(name).toLowerCase()] = value; },
    end(value = '') { this.body += String(value || ''); this.writableEnded = true; resolve(this); },
    done
  };
}

function request() {
  const req = new EventEmitter();
  req.method = 'GET';
  req.body = {};
  req.headers = { authorization: 'Bearer token-1' };
  req.url = '/api/my-ads';
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
  let started = 0;
  let releaseBoth;
  const bothStarted = new Promise((resolve) => { releaseBoth = resolve; });
  global.fetch = async (url) => {
    const value = String(url);
    calls.push(value);
    if (value.endsWith('/auth/v1/user')) return jsonResponse(true, { id: 'user-fast' });
    if (value.includes('/rest/v1/ads?')) {
      started += 1;
      if (started === 2) releaseBoth();
      await Promise.race([
        bothStarted,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Ownership queries were not started in parallel.')), 300))
      ]);
      const parsed = new URL(value);
      const owner = parsed.searchParams.get('custom_fields->>owner_user_id');
      const direct = parsed.searchParams.get('user_id');
      assert(owner === 'eq.user-fast' || direct === 'eq.user-fast',
        'My Ads query is not filtered by the signed-in user at Supabase.');
      if (direct) return jsonResponse(true, [{ id: 'owned-fast', user_id: 'user-fast', title: 'Fast row' }]);
      return jsonResponse(true, []);
    }
    throw new Error(`Unexpected URL ${url}`);
  };

  delete require.cache[require.resolve('./api-handlers/my-ads')];
  const handler = require('./api-handlers/my-ads');
  const res = responseRecorder();
  await handler(request(), res);
  await res.done;
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(JSON.parse(res.body).ads.map((row) => row.id), ['owned-fast']);
  const adCalls = calls.filter((url) => url.includes('/rest/v1/ads?'));
  assert.strictEqual(adCalls.length, 2,
    'Normal My Ads path must perform only the two parallel owner-filtered queries.');
  assert(adCalls.every((url) => new URL(url).searchParams.toString().includes('eq.user-fast')),
    'A full marketplace scan was performed on the normal My Ads path.');
  assert.strictEqual(res.headers['cache-control'], 'no-store');

  global.fetch = oldFetch;
  for (const [key, value] of Object.entries(oldEnv)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
  console.log('Dashboard Favorites immediate render + parallel My Ads speed regression test passed.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
