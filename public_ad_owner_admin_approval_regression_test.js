'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

const root = __dirname;
const filtersSource = fs.readFileSync(path.join(root, 'public', 'index-filters.js'), 'utf8');
const adminSource = fs.readFileSync(path.join(root, 'public', 'admin.js'), 'utf8');
const dispatcherSource = fs.readFileSync(path.join(root, 'lib', 'api-dispatcher.js'), 'utf8');
const utilsSource = fs.readFileSync(path.join(root, 'lib', 'public-ads-utils.js'), 'utf8');

assert(filtersSource.includes('currentRouteAccessToken'), 'Direct ad route does not obtain the signed-in access token.');
assert(filtersSource.includes('fetchRouteAdApi(cleanId, token)'), 'Direct ad route does not retry securely for owner preview.');
assert(filtersSource.includes("normalized.detailVisibility = result.payload.visibility || 'public'"), 'Owner preview visibility is not preserved.');
assert(adminSource.includes("fetch('/api/admin-ad-action'"), 'Admin ad updates still rely only on browser RLS.');
assert(adminSource.includes("if(table==='ads')return serverAdAction('update'"), 'Admin ads are not updated through the service-role endpoint.');
assert(dispatcherSource.includes("'/api/admin-ad-action'"), 'Admin ad action endpoint is not dispatched.');
assert(utilsSource.includes('const fetchLimit = id ? 1'), 'Public list query does not widen the pre-filter fetch window.');

function responseRecorder() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    writableEnded: false,
    setHeader(name, value) { this.headers[String(name).toLowerCase()] = value; },
    end(value = '') { this.body = String(value); this.writableEnded = true; },
  };
}

function request({ method = 'GET', url = '/', headers = {}, body } = {}) {
  const req = new EventEmitter();
  req.method = method;
  req.url = url;
  req.headers = headers;
  req.body = body;
  return req;
}

(async () => {
  const oldFetch = global.fetch;
  const oldEnv = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
  process.env.SUPABASE_URL = 'https://project.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';

  let adRow = {
    id: '5730c955-76c3-4974-84d8-e625b0ed0b21',
    user_id: 'owner-1',
    title: 'New Real Ad',
    description: 'Real listing',
    price: 1000,
    status: 'pending',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 20 * 86400000).toISOString(),
    image_url: 'data:image/jpeg;base64,abc',
    images: ['data:image/jpeg;base64,abc'],
    custom_fields: { owner_user_id: 'owner-1', image_count: 1, category_slug: 'vehicles' },
  };

  const calls = [];
  global.fetch = async (url, options = {}) => {
    const value = String(url);
    calls.push({ value, options });

    if (value.endsWith('/auth/v1/user')) {
      const token = String(options.headers?.Authorization || '').replace(/^Bearer\s+/i, '');
      if (token === 'admin-token') {
        return { ok: true, status: 200, json: async () => ({ id: 'admin-1', email: 'ehemehe.lk@gmail.com', user_metadata: {} }) };
      }
      if (token === 'owner-token') {
        return { ok: true, status: 200, json: async () => ({ id: 'owner-1', email: 'owner@example.com', user_metadata: {} }) };
      }
      return { ok: false, status: 401, json: async () => ({}) };
    }

    if (value.includes('/rest/v1/categories?')) {
      return { ok: true, status: 200, text: async () => '[]' };
    }

    if (value.includes('/rest/v1/staff_permissions?')) {
      return { ok: true, status: 200, text: async () => '[]' };
    }

    if (value.includes('/rest/v1/ads?')) {
      const parsed = new URL(value);
      const id = String(parsed.searchParams.get('id') || '').replace(/^eq\./, '');
      if (options.method === 'PATCH') {
        const changes = JSON.parse(options.body || '{}');
        adRow = { ...adRow, ...changes };
        return { ok: true, status: 200, text: async () => JSON.stringify([adRow]) };
      }
      if (options.method === 'DELETE') {
        return { ok: true, status: 200, text: async () => JSON.stringify([adRow]) };
      }
      const rows = !id || id === adRow.id ? [adRow] : [];
      return { ok: true, status: 200, text: async () => JSON.stringify(rows) };
    }

    if (value.includes('/rest/v1/ad_promotions?') || value.includes('/rest/v1/ad_reports?')) {
      return { ok: true, status: 204, text: async () => '' };
    }

    return { ok: true, status: 200, text: async () => '[]', json: async () => ({}) };
  };

  try {
    for (const moduleName of ['./lib/otp-utils', './lib/public-ads-utils', './api-handlers/public-ad', './api-handlers/admin-ad-action']) {
      delete require.cache[require.resolve(moduleName)];
    }
    const publicAdHandler = require('./api-handlers/public-ad');
    const adminActionHandler = require('./api-handlers/admin-ad-action');

    // Anonymous visitors must not see pending ads.
    let res = responseRecorder();
    await publicAdHandler(request({ url: `/api/public-ad?id=${adRow.id}` }), res);
    assert.strictEqual(res.statusCode, 404, 'Pending ad leaked publicly.');

    // The signed-in owner can preview the exact pending ad instead of Ad not found.
    res = responseRecorder();
    await publicAdHandler(request({
      url: `/api/public-ad?id=${adRow.id}`,
      headers: { authorization: 'Bearer owner-token' },
    }), res);
    assert.strictEqual(res.statusCode, 200, 'Owner could not preview their pending ad.');
    let payload = JSON.parse(res.body);
    assert.strictEqual(payload.visibility, 'owner-preview');
    assert.strictEqual(payload.ad.id, adRow.id);

    // Admin approval must update the real DB record with the server service role.
    res = responseRecorder();
    await adminActionHandler(request({
      method: 'POST',
      url: '/api/admin-ad-action',
      headers: { authorization: 'Bearer admin-token' },
      body: { action: 'update', id: adRow.id, changes: { status: 'approved', reject_reason: null } },
    }), res);
    assert.strictEqual(res.statusCode, 200, `Admin approval failed: ${res.body}`);
    assert.strictEqual(adRow.status, 'approved');
    const patchCall = calls.find((call) => call.value.includes('/rest/v1/ads?') && call.options.method === 'PATCH');
    assert(patchCall, 'No service-role PATCH was issued for approval.');
    assert.strictEqual(patchCall.options.headers.Authorization, 'Bearer service-key');

    // Once approved, the same UUID is immediately public.
    res = responseRecorder();
    await publicAdHandler(request({ url: `/api/public-ad?id=${adRow.id}` }), res);
    assert.strictEqual(res.statusCode, 200, 'Approved ad still returned Ad not found.');
    payload = JSON.parse(res.body);
    assert.strictEqual(payload.visibility, 'public');
    assert.strictEqual(payload.ad.status, 'approved');

    // A crowded pending queue must not hide older approved rows from list pages.
    const pendingRows = Array.from({ length: 180 }, (_, index) => ({
      id: `pending-${index}`,
      title: `Pending ${index}`,
      status: 'pending',
      created_at: new Date(Date.now() - index * 1000).toISOString(),
      custom_fields: {},
    }));
    const approvedRows = [
      { id: 'approved-a', title: 'Approved A', status: 'approved', created_at: new Date(Date.now() - 300000).toISOString(), custom_fields: {} },
      { id: 'approved-b', title: 'Approved B', status: 'live', created_at: new Date(Date.now() - 301000).toISOString(), custom_fields: {} },
    ];
    global.fetch = async (url) => {
      const value = String(url);
      if (value.includes('/rest/v1/categories?')) return { ok: true, status: 200, text: async () => '[]' };
      if (value.includes('/rest/v1/ads?')) {
        const limit = Number(new URL(value).searchParams.get('limit') || 0);
        return { ok: true, status: 200, text: async () => JSON.stringify([...pendingRows, ...approvedRows].slice(0, limit)) };
      }
      return { ok: true, status: 200, text: async () => '[]' };
    };
    delete require.cache[require.resolve('./lib/public-ads-utils')];
    const publicUtils = require('./lib/public-ads-utils');
    const visible = await publicUtils.queryAds({ limit: 60, approvedOnly: true });
    assert.deepStrictEqual(visible.map((row) => row.id), ['approved-a', 'approved-b'], 'Pending rows crowded approved listings out of All Ads.');
  } finally {
    global.fetch = oldFetch;
    Object.entries(oldEnv).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  }

  console.log('PUBLIC_AD_OWNER_ADMIN_APPROVAL_REGRESSION_TEST_PASSED');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
