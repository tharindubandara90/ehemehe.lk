const assert = require('assert');
const fs = require('fs');

const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const server = fs.readFileSync('server.js', 'utf8');
const desktop = fs.readFileSync('public/desktop-home-exact.js', 'utf8');
const css = fs.readFileSync('public/css/desktop-home-exact.css', 'utf8');

assert(!Object.prototype.hasOwnProperty.call(vercel, 'outputDirectory'), 'Static-only output disables /api/public-home on Vercel.');
assert(server.includes("'/api/public-home': publicHome"), 'Root server does not dispatch public-home.');
assert(server.includes('const server = http.createServer'), 'Captured root HTTP server is missing.');
assert(server.includes('server.listen(port'), 'Vercel root server detection listen call is missing.');
assert(desktop.includes('loadAdsDirectly'), 'Desktop listings have no direct Supabase resilience fallback.');
assert(desktop.includes('PUBLIC_SUPABASE_ANON_KEY'), 'Desktop fallback cannot authenticate with the public anon role.');
assert(desktop.includes("fetchJson('/api/public-home'"), 'Primary optimized marketplace API was removed.');
assert(!/font-weight:(850|900)/.test(css), 'Desktop typography still uses synthetic ultra-heavy weights.');
assert(css.includes('font-family:"Plus Jakarta Sans",system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif'), 'Original Plus Jakarta Sans desktop font stack is missing.');

const originalFetch = global.fetch;
const originalEnv = { ...process.env };
process.env.SUPABASE_URL = 'https://test-project.supabase.co';
process.env.SUPABASE_ANON_KEY = 'public-test-key';
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

let calls = 0;
global.fetch = async (url) => {
  calls += 1;
  const value = String(url);
  const isImageSelect = value.includes('image_url%2Ccreated_at%2Cupdated_at') || value.includes('image_url%2Ccreated_at');
  const payload = isImageSelect
    ? [{ id: 'ad-1', image_url: 'https://images.example/ad-1.webp', created_at: '2026-07-18T00:00:00Z', updated_at: '2026-07-18T00:00:00Z' }]
    : [{
        id: 'ad-1', title: 'Toyota Aqua', description: 'Hybrid car', price: 6500000,
        status: 'approved', condition: 'Used', category_id: null, city_id: null,
        custom_fields: { district: 'Kandy', city: 'Kandy', category_name: 'Vehicles' },
        created_at: '2026-07-18T00:00:00Z', updated_at: '2026-07-18T00:00:00Z'
      }];
  return {
    ok: true,
    status: 200,
    async json() { return payload; }
  };
};

function responseHarness() {
  let body = '';
  const headers = {};
  return {
    res: {
      statusCode: 0,
      setHeader(name, value) { headers[String(name).toLowerCase()] = value; },
      end(value = '') { body += Buffer.isBuffer(value) ? value.toString('utf8') : String(value); }
    },
    result() { return { body, headers }; }
  };
}

(async () => {
  try {
    delete require.cache[require.resolve('./server-routes/public-home')];
    const publicHome = require('./server-routes/public-home');
    const harness = responseHarness();
    await publicHome({ method: 'GET', headers: {} }, harness.res);
    const output = harness.result();
    assert.strictEqual(harness.res.statusCode, 200, 'public-home did not return 200.');
    const data = JSON.parse(output.body);
    assert.strictEqual(data.ok, true);
    assert.strictEqual(data.ads.length, 1, 'Approved ad disappeared from public-home.');
    assert.strictEqual(data.ads[0].id, 'ad-1');
    assert(data.ads[0].image_url.includes('images.example'), 'First listing image was not preserved.');
    assert(calls >= 2, 'Compact ad metadata and first image were not loaded independently.');
    console.log('DESKTOP_LIVE_ADS_DELIVERY_REGRESSION_TEST_PASSED');
  } finally {
    global.fetch = originalFetch;
    process.env = originalEnv;
  }
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
