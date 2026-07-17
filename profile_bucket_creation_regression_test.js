'use strict';

const assert = require('assert');

process.env.SUPABASE_URL = 'https://project.supabase.co';
process.env.SUPABASE_ANON_KEY = 'anon-test-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key';

const handler = require('./api-handlers/upload-profile-photo');

const calls = [];
const originalFetch = global.fetch;

global.fetch = async (url, options = {}) => {
  const method = options.method || 'GET';
  calls.push({ url: String(url), method, body: options.body });

  if (String(url).endsWith('/auth/v1/user') && method === 'GET') {
    return new Response(JSON.stringify({ id: 'user-123', user_metadata: { name: 'Tester' } }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }

  if (String(url).endsWith('/storage/v1/bucket/profile-images') && method === 'GET') {
    const previousCreate = calls.some((call) => call.url.endsWith('/storage/v1/bucket') && call.method === 'POST');
    if (!previousCreate) {
      // This is the production failure shape: HTTP 400 with a 404 code in JSON.
      return new Response(JSON.stringify({ statusCode: '404', error: 'Bucket not found', message: 'Bucket not found' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ id: 'profile-images', public: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }

  if (String(url).endsWith('/storage/v1/bucket') && method === 'POST') {
    return new Response(JSON.stringify({ name: 'profile-images' }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }

  if (String(url).includes('/storage/v1/object/profile-images/') && method === 'POST') {
    return new Response(JSON.stringify({ Key: 'profile-images/user-123/avatar.png' }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }

  if (String(url).endsWith('/auth/v1/admin/users/user-123') && method === 'PUT') {
    const parsed = JSON.parse(String(options.body || '{}'));
    assert.ok(parsed.user_metadata.avatar_url.includes('/storage/v1/object/public/profile-images/'));
    return new Response(JSON.stringify({ id: 'user-123', user_metadata: parsed.user_metadata }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }

  throw new Error(`Unexpected fetch: ${method} ${url}`);
};

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    end(value) { this.body = String(value || ''); this.writableEnded = true; }
  };
}

(async () => {
  const req = {
    method: 'POST',
    headers: { authorization: 'Bearer user-token' },
    body: { imageData: `data:image/png;base64,${Buffer.from('fake-png').toString('base64')}` }
  };
  const res = createResponse();

  await handler(req, res);
  const payload = JSON.parse(res.body);

  assert.strictEqual(res.statusCode, 200, res.body);
  assert.strictEqual(payload.ok, true);
  assert.ok(payload.avatarUrl.includes('/storage/v1/object/public/profile-images/'));
  assert.ok(calls.some((call) => call.url.endsWith('/storage/v1/bucket') && call.method === 'POST'), 'Missing bucket was not created.');
  assert.ok(calls.some((call) => call.url.endsWith('/auth/v1/admin/users/user-123') && call.method === 'PUT'), 'Avatar metadata was not persisted server-side.');

  console.log('Profile bucket creation regression: PASS');
})().finally(() => {
  global.fetch = originalFetch;
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
