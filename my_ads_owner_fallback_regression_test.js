'use strict';
const assert = require('assert');

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key';
process.env.SUPABASE_ANON_KEY = 'anon-test-key';

const originalFetch = global.fetch;
const calls = [];
global.fetch = async (url) => {
  calls.push(String(url));
  if (String(url).includes('/auth/v1/user')) {
    return { ok: true, json: async () => ({ id: 'user-123' }) };
  }
  const parsed = new URL(String(url));
  if (parsed.searchParams.get('user_id') === 'eq.user-123') {
    return { ok: true, json: async () => [] };
  }
  if (parsed.searchParams.get('custom_fields->>owner_user_id') === 'eq.user-123') {
    return {
      ok: true,
      json: async () => ([{
        id: 'ad-1',
        title: 'Owned through JSON metadata',
        price: 1000,
        status: 'approved',
        created_at: '2026-07-19T00:00:00.000Z',
        custom_fields: { owner_user_id: 'user-123', city: 'Kandy' }
      }])
    };
  }
  throw new Error(`Unexpected fetch: ${url}`);
};

function responseRecorder() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    end(value) { this.body = value; }
  };
}

(async () => {
  try {
    const handler = require('./api-handlers/my-ads');
    const req = { method: 'GET', headers: { authorization: 'Bearer access-token' } };
    const res = responseRecorder();
    await handler(req, res);
    const body = JSON.parse(res.body);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(body.ok, true);
    assert.strictEqual(body.ads.length, 1);
    assert.strictEqual(body.ads[0].id, 'ad-1');
    assert.strictEqual(body.ads[0].image_url, '/api/ad-image?id=ad-1&index=0');
    assert(calls.some((url) => url.includes('custom_fields-%3E%3Eowner_user_id') || url.includes('custom_fields->>owner_user_id')),
      'JSON owner fallback query was not executed');
    console.log('My Ads owner fallback regression passed.');
  } finally {
    global.fetch = originalFetch;
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
