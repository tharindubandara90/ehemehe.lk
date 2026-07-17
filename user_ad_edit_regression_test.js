const assert = require('assert');
const fs = require('fs');
const { EventEmitter } = require('events');

const runtime = fs.readFileSync('public/post-ad-runtime.js', 'utf8');
const runtimeCss = fs.readFileSync('public/post-ad-runtime.css', 'utf8');
const brandCss = fs.readFileSync('public/brand-theme.css', 'utf8');
const server = fs.readFileSync('server.js', 'utf8');
const endpointSource = fs.readFileSync('api/update-my-ad.js', 'utf8');

assert(runtime.includes('data-ehm-edit-ad'), 'My Ads cards are missing the Edit Ad action.');
assert(runtime.includes("fetch('/api/update-my-ad'"), 'Dashboard edit form is not connected to the update API.');
assert(runtime.includes('Save & Send for Review'), 'Admin review warning/action is missing.');
assert(runtimeCss.includes('.ehm-edit-ad-modal'), 'Edit modal styling is missing.');
assert(runtimeCss.includes('.ehm-dashboard-edit'), 'Edit button styling is missing.');
assert(brandCss.includes('c3JjL2NvbXBvbmVudHMvSGVhZGVyLnRzeEAxMTQ6MTQ'), 'Mobile logged-in avatar block is not targeted.');
assert(/ehm-physical-mobile[\s\S]{0,240}display\s*:\s*none\s*!important/.test(brandCss), 'Mobile avatar/dropdown is not hidden.');
assert(server.includes("() => require('./api/update-my-ad')") || server.includes("const updateMyAd = require('./api/update-my-ad')"), 'Local/Vercel server does not load the update endpoint.');
assert(server.includes("'/api/update-my-ad': () => require('./api/update-my-ad')") || server.includes("'/api/update-my-ad': updateMyAd"), 'Local/Vercel server route is missing.');
assert(endpointSource.includes("status: 'pending'"), 'User edits do not force pending status.');
assert(endpointSource.includes('requires_admin_review: true'), 'Review requirement metadata is missing.');
assert(endpointSource.includes('ownsAd(existing, user.id)'), 'Ownership protection is missing.');

function request(body, token = 'token-1') {
  const req = new EventEmitter();
  req.method = 'PATCH';
  req.headers = { authorization: `Bearer ${token}` };
  process.nextTick(() => {
    req.emit('data', Buffer.from(JSON.stringify(body)));
    req.emit('end');
  });
  return req;
}

function response() {
  let finish;
  const finished = new Promise((resolve) => { finish = resolve; });
  const res = {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(name, value) { this.headers[String(name).toLowerCase()] = value; },
    end(value) { this.body = String(value || ''); finish(this); }
  };
  res.finished = finished;
  return res;
}

(async () => {
  const oldFetch = global.fetch;
  const oldUrl = process.env.SUPABASE_URL;
  const oldService = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const oldAnon = process.env.SUPABASE_ANON_KEY;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
  process.env.SUPABASE_ANON_KEY = 'anon-key';

  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).endsWith('/auth/v1/user')) {
      return { ok: true, json: async () => ({ id: 'user-1', user_metadata: { name: 'Owner' } }) };
    }
    if (String(url).includes('/rest/v1/ads?') && (!options.method || options.method === 'GET')) {
      return {
        ok: true,
        json: async () => ([{
          id: 'ad-1',
          user_id: 'user-1',
          title: 'Old title',
          description: 'Old description',
          price: 100,
          status: 'approved',
          city_id: 'city-old',
          images: [],
          custom_fields: { owner_user_id: 'user-1', district: 'Badulla', city: 'Mahiyanganaya' }
        }])
      };
    }
    if (String(url).includes('/rest/v1/districts?')) {
      return { ok: true, json: async () => ([{ id: 'district-1', name: 'Badulla', slug: 'badulla' }]) };
    }
    if (String(url).includes('/rest/v1/cities?')) {
      return { ok: true, json: async () => ([{ id: 'city-1', name: 'Mahiyanganaya', district_id: 'district-1' }]) };
    }
    if (String(url).includes('/rest/v1/ads?') && options.method === 'PATCH') {
      const payload = JSON.parse(options.body);
      assert.strictEqual(payload.status, 'pending', 'Saved edit must be pending.');
      assert.strictEqual(payload.reject_reason, null, 'Old rejection reason must be cleared.');
      assert.strictEqual(payload.city_id, 'city-1', 'Edited city should resolve to its database ID.');
      assert.strictEqual(payload.custom_fields.previous_status_before_edit, 'approved');
      assert.strictEqual(payload.custom_fields.requires_admin_review, true);
      assert.strictEqual(payload.custom_fields.owner_user_id, 'user-1');
      return {
        ok: true,
        text: async () => JSON.stringify([{ id: 'ad-1', ...payload, created_at: '2026-07-17T00:00:00Z' }])
      };
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };

  const handler = require('./api/update-my-ad');
  const req = request({
    id: 'ad-1',
    title: 'Updated title',
    description: 'Updated complete description',
    price: '250000',
    condition: 'used',
    district: 'Badulla',
    city: 'Mahiyanganaya'
  });
  const res = response();
  await handler(req, res);
  await res.finished;
  assert.strictEqual(res.statusCode, 200, res.body);
  const output = JSON.parse(res.body);
  assert.strictEqual(output.ok, true);
  assert.strictEqual(output.ad.status, 'pending');
  assert(calls.some((call) => call.options.method === 'PATCH'), 'Supabase PATCH was not made.');

  global.fetch = oldFetch;
  if (oldUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = oldUrl;
  if (oldService === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = oldService;
  if (oldAnon === undefined) delete process.env.SUPABASE_ANON_KEY; else process.env.SUPABASE_ANON_KEY = oldAnon;

  console.log('User ad edit + mobile profile regression test passed.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
