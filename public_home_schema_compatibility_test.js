const assert = require('assert');
const zlib = require('zlib');

async function run() {
  const handlerPath = require.resolve('./server-routes/public-home.js');
  delete require.cache[handlerPath];
  const handler = require(handlerPath);
  const originalFetch = global.fetch;
  let preferredRejected = false;
  let coreUsed = false;

  global.fetch = async (url) => {
    const decoded = decodeURIComponent(String(url));
    if (decoded.includes('select=id,image_url,created_at,updated_at')) {
      return {
        ok: true,
        status: 200,
        json: async () => [{
          id: 'aaaaaaaa-bbbb-cccc-dddd-000000000001',
          image_url: '/assets/ehemehe_logo_header.webp',
          created_at: '2026-07-18T00:00:00Z',
          updated_at: '2026-07-18T00:00:00Z'
        }]
      };
    }
    if (decoded.includes('promotion_type')) {
      preferredRejected = true;
      return {
        ok: false,
        status: 400,
        json: async () => ({ message: 'column ads.promotion_type does not exist' })
      };
    }
    if (decoded.includes('select=id,title,description,price,currency,phone,condition,status,category_id,city_id,custom_fields,created_at,updated_at')) {
      coreUsed = true;
      return {
        ok: true,
        status: 200,
        json: async () => [{
          id: 'aaaaaaaa-bbbb-cccc-dddd-000000000001',
          title: 'Galaxy S16',
          description: 'Live marketplace ad',
          price: 125000,
          currency: 'LKR',
          status: 'approved',
          custom_fields: { category_name: 'Mobile Phones & Tablets', city_name: 'Colombo' },
          created_at: '2026-07-18T00:00:00Z',
          updated_at: '2026-07-18T00:00:00Z'
        }]
      };
    }
    throw new Error(`Unexpected request: ${decoded}`);
  };

  const chunks = [];
  const headers = {};
  const req = { method: 'GET', url: '/api/public-home', headers: { 'accept-encoding': 'gzip' } };
  const res = {
    statusCode: 0,
    setHeader(name, value) { headers[String(name).toLowerCase()] = String(value); },
    end(value) { if (value) chunks.push(Buffer.from(value)); this.writableEnded = true; }
  };

  try {
    await handler(req, res);
  } finally {
    global.fetch = originalFetch;
  }

  assert(preferredRejected, 'Test did not exercise the optional-column rejection path.');
  assert(coreUsed, 'Core schema-compatible list query was not used.');
  assert.strictEqual(res.statusCode, 200, 'Public home endpoint failed after schema-compatible fallback.');
  const raw = headers['content-encoding'] === 'gzip'
    ? zlib.gunzipSync(Buffer.concat(chunks)).toString('utf8')
    : Buffer.concat(chunks).toString('utf8');
  const body = JSON.parse(raw);
  assert.strictEqual(body.ok, true);
  assert.strictEqual(body.ads.length, 1, 'A real approved ad disappeared after the preferred select failed.');
  assert.strictEqual(body.ads[0].title, 'Galaxy S16');
  assert(body.ads[0].image_url, 'List image route/first image was not preserved.');
  console.log('PUBLIC_HOME_SCHEMA_COMPATIBILITY_TEST_PASSED');
}

run().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
