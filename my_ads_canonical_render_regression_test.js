const assert = require('assert');
const fs = require('fs');
const { EventEmitter } = require('events');

const runtime = fs.readFileSync('public/post-ad-runtime.js', 'utf8');
assert(runtime.includes("ehemehe:myAdsCache:v3:"), 'My Ads cache version was not advanced past contaminated v2 rows.');
assert(runtime.includes("/^ehemehe:myAdsCache:v[12]:/"), 'Old contaminated My Ads caches are not cleared.');
assert(runtime.includes("const section = myAdsHeading.parentElement?.parentElement || myAdsHeading.parentElement"),
  'My Ads panel is not mounted in the original visible dashboard section.');
assert(runtime.includes("panel = ensureDashboardAdsPanel();\n    if (panel?.isConnected) paintDashboardAds(panel, ads, true);"),
  'My Ads panel is not reacquired after the async fetch/React remount.');
assert(runtime.includes('data-ehm-retry-my-ads'), 'My Ads has no visible retry state on a real API failure.');
assert(!/setInterval\s*\(/.test(runtime), 'My Ads fix introduced permanent polling.');

function responseRecorder() {
  let resolve;
  const done = new Promise((r) => { resolve = r; });
  return {
    statusCode: 200, headers: {}, body: '',
    setHeader(name, value) { this.headers[String(name).toLowerCase()] = value; },
    end(value = '') { this.body += String(value || ''); resolve(this); }, done
  };
}
function request() {
  const req = new EventEmitter();
  req.method = 'GET';
  req.headers = { authorization: 'Bearer token' };
  req.url = '/api/my-ads?summary=1';
  return req;
}
function jr(ok, payload, status = ok ? 200 : 400) {
  return { ok, status, json: async () => payload, text: async () => JSON.stringify(payload) };
}

(async () => {
  const oldFetch = global.fetch;
  const oldEnv = { ...process.env };
  process.env.SUPABASE_URL = 'https://project.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'anon';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
  global.fetch = async (url) => {
    const u = String(url);
    if (u.endsWith('/auth/v1/user')) return jr(true, { id: 'real-user' });
    if (u.includes('/rest/v1/ads?')) return jr(true, [
      { id: 'mine-1', user_id: 'generic', title: 'Mine 1', custom_fields: { owner_user_id: 'real-user' } },
      { id: 'mine-2', user_id: 'real-user', title: 'Mine 2', custom_fields: { submitted_at: '2026-07-01', verified_contact_phones: ['+94770000000'] } },
      { id: 'demo-1', user_id: 'real-user', title: 'Imported demo', custom_fields: {} },
      { id: 'other-1', user_id: 'other', title: 'Other', custom_fields: { owner_user_id: 'other' } }
    ]);
    throw new Error(`Unexpected URL: ${u}`);
  };
  delete require.cache[require.resolve('./api-handlers/my-ads')];
  const handler = require('./api-handlers/my-ads');
  const res = responseRecorder();
  await handler(request(), res); await res.done;
  assert.strictEqual(res.statusCode, 200);
  const ids = JSON.parse(res.body).ads.map((row) => row.id);
  assert.deepStrictEqual(ids, ['mine-1', 'mine-2'], 'My Ads includes imported/demo or another user rows.');
  global.fetch = oldFetch;
  for (const k of Object.keys(process.env)) if (!(k in oldEnv)) delete process.env[k];
  Object.assign(process.env, oldEnv);
  console.log('My Ads canonical ownership + visible panel regression test passed.');
})().catch((e) => { console.error(e); process.exit(1); });
