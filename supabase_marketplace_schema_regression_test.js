const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.OTP_SECRET = 'test-otp-secret-for-marketplace-schema';

const { makeToken } = require('./api/_otp-utils');
const publishAd = require('./api/publish-ad');

const root = __dirname;
const sql = fs.readFileSync(path.join(root, 'supabase_marketplace_core_schema.sql'), 'utf8');
const legacySql = fs.readFileSync(path.join(root, 'supabase_post_ad_end_to_end.sql'), 'utf8');

assert(/create table if not exists public\.ads/i.test(sql), 'Core migration must create public.ads.');
assert(sql.indexOf('create table if not exists public.ads') < sql.indexOf('create index if not exists ads_status_created_at_idx'), 'ads table must be created before its indexes.');
for (const column of ['user_id','title','description','price','category_id','city_id','images','custom_fields','status','created_at','updated_at']) {
  assert(new RegExp(`\\b${column}\\b`, 'i').test(sql), `Migration is missing ${column}.`);
}
assert(/notify pgrst, 'reload schema'/i.test(sql), 'Migration must refresh the PostgREST schema cache.');
assert(/ehemehe public read approved ads/i.test(sql), 'Public approved-ad policy is missing.');
assert.strictEqual(legacySql, sql, 'The legacy Post Ad migration must contain the same complete core schema.');

function response(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function invoke(body, fetchImpl) {
  const originalFetch = global.fetch;
  global.fetch = fetchImpl;
  const req = new EventEmitter();
  req.method = 'POST';
  req.headers = { authorization: 'Bearer valid-user-token' };

  let statusCode = 200;
  let responseBody = '';
  const headers = {};
  const res = {
    setHeader(name, value) { headers[name.toLowerCase()] = value; },
    get statusCode() { return statusCode; },
    set statusCode(value) { statusCode = value; },
    end(value) { responseBody = String(value || ''); }
  };

  const pending = publishAd(req, res);
  setImmediate(() => {
    req.emit('data', Buffer.from(JSON.stringify(body)));
    req.emit('end');
  });
  await pending;
  global.fetch = originalFetch;
  return { statusCode, body: JSON.parse(responseBody), headers };
}

function validBody() {
  const phone = '94701234567';
  return {
    title: 'Honda vehicle for sale',
    description: 'Well maintained vehicle with complete documents.',
    price: 3500000,
    categoryId: 'vehicles',
    categoryName: 'Vehicles',
    subcategoryId: 'cars',
    subcategoryName: 'Cars',
    district: 'Kandy',
    city: 'Nawalapitiya',
    condition: 'Used',
    phones: [phone],
    phoneProof: makeToken({
      kind: 'ad_contact_phones_verified',
      verified: true,
      phones: [phone],
      expiresAt: Date.now() + 300000
    }),
    images: [],
    customFields: { brand: 'Honda', model: 'Fit' }
  };
}

(async () => {
  let insertedPayload = null;
  const success = await invoke(validBody(), async (url, options = {}) => {
    if (String(url).includes('/auth/v1/user')) {
      return response(200, { id: '11111111-1111-1111-1111-111111111111', user_metadata: { name: 'Test User' } });
    }
    if (String(url).includes('/rest/v1/categories') || String(url).includes('/rest/v1/districts') || String(url).includes('/rest/v1/cities')) {
      return response(200, []);
    }
    if (String(url).includes('/rest/v1/ads') && options.method === 'POST') {
      insertedPayload = JSON.parse(options.body);
      return response(201, [{ id: '22222222-2222-2222-2222-222222222222', ...insertedPayload, created_at: new Date().toISOString() }]);
    }
    throw new Error(`Unexpected fetch: ${url}`);
  });

  assert.strictEqual(success.statusCode, 200, JSON.stringify(success.body));
  assert.strictEqual(success.body.ok, true);
  assert.strictEqual(insertedPayload.category_id, null, 'Unknown lookup slugs must not be inserted into UUID category_id.');
  assert.strictEqual(insertedPayload.city_id, null, 'Unknown city names must not be inserted into UUID city_id.');
  assert.strictEqual(insertedPayload.custom_fields.subcategory_name, 'Cars');
  assert.strictEqual(insertedPayload.custom_fields.city, 'Nawalapitiya');

  const missing = await invoke(validBody(), async (url) => {
    if (String(url).includes('/auth/v1/user')) {
      return response(200, { id: '11111111-1111-1111-1111-111111111111', user_metadata: {} });
    }
    if (String(url).includes('/rest/v1/categories') || String(url).includes('/rest/v1/districts') || String(url).includes('/rest/v1/cities')) {
      return response(200, []);
    }
    if (String(url).includes('/rest/v1/ads')) {
      return response(404, {
        code: 'PGRST205',
        message: "Could not find the table 'public.ads' in the schema cache"
      });
    }
    throw new Error(`Unexpected fetch: ${url}`);
  });

  assert.strictEqual(missing.statusCode, 503);
  assert.strictEqual(missing.body.code, 'DATABASE_SCHEMA_MISSING_ADS');
  assert(/supabase_marketplace_core_schema\.sql/i.test(missing.body.message));

  console.log('Supabase marketplace schema regression test passed.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
