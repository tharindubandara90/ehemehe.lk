'use strict';

const assert = require('assert');
const fs = require('fs');
const { EventEmitter } = require('events');

const runtime = fs.readFileSync('public/post-ad-runtime.js', 'utf8');
const bundle = fs.readFileSync('public/js/index-BsKly-Vj.js', 'utf8');
const api = fs.readFileSync('api-handlers/my-ads.js', 'utf8');

assert(!bundle.includes('v=Ht.slice(0,3)'),
  'The React dashboard still renders the three bundled demo ads in My Ads.');
assert(bundle.includes('const B=Ht.filter(z=>f.includes(z.id)),v=[],N='),
  'The native My Ads seed must be empty until authenticated rows are painted.');

const renderStart = runtime.indexOf('async function renderDashboard()');
const renderEnd = runtime.indexOf('\n  // -------------------------- Lifecycle', renderStart);
const renderBlock = runtime.slice(renderStart, renderEnd);
assert(renderStart > -1 && renderEnd > renderStart, 'renderDashboard block was not found.');
assert(renderBlock.includes('refreshDashboardAds(authSession, false);'),
  'Dashboard does not start the authenticated My Ads refresh.');
assert(!renderBlock.includes('await loadDashboardAds('),
  'Dashboard still blocks DOM mutation handling while My Ads waits for the network.');
assert(runtime.includes('function applyLoadedDashboardAds(ads)'),
  'Loaded My Ads rows are not applied independently after the non-blocking request.');

const prefetchStart = runtime.indexOf('function prefetchDashboardAds(event)');
const prefetchEnd = runtime.indexOf("\n  window.addEventListener('ehemehe:auth-ready'", prefetchStart);
const prefetchBlock = runtime.slice(prefetchStart, prefetchEnd);
assert(!prefetchBlock.includes("!route().startsWith('/dashboard')"),
  'My Ads is still prefetched only after opening the dashboard.');
assert(prefetchBlock.includes('loadDashboardAds(true, authSession)'),
  'Authenticated My Ads is not warmed in the background.');

assert(runtime.includes('runtime.dashboardAds = cached;'),
  'Changing accounts does not replace the previous account\'s in-memory My Ads rows.');
assert(runtime.includes('runtime.dashboardLoadedAt = cached.length ? Date.now() : 0;'),
  'A cache miss can still retain the previous account\'s loaded state.');
assert(api.indexOf("{ 'custom_fields->>owner_user_id': `eq.${userId}` }") < api.indexOf("{ user_id: `eq.${userId}` }"),
  'The stable JSON owner lookup is not the first compact My Ads query.');

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
      assert.strictEqual(parsed.searchParams.get('custom_fields->>owner_user_id'), 'eq.owner-1',
        'First My Ads request is not filtered to the authenticated owner.');
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
  assert.strictEqual(adCalls.length, 1,
    'Current-schema My Ads should finish with one compact owner-filtered request.');

  global.fetch = oldFetch;
  for (const [key, value] of Object.entries(oldEnv)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
  console.log('My Ads instant owner-only regression test passed.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
