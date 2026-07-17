const { Readable } = require('stream');
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test';
process.env.SUPABASE_ANON_KEY = 'anon-test';
process.env.OTP_SECRET = 'otp-test-secret';

function makeReq(method, url, body, headers = {}) {
  const req = new Readable({ read() {} });
  req.method = method;
  req.url = url;
  req.headers = headers;
  process.nextTick(() => {
    if (body !== undefined) req.push(JSON.stringify(body));
    req.push(null);
  });
  return req;
}
function makeRes() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(k,v){ this.headers[k.toLowerCase()] = v; },
    hasHeader(k){ return Object.prototype.hasOwnProperty.call(this.headers, k.toLowerCase()); },
    end(body){ this.body = body; this.done?.(); }
  };
}
async function invoke(handler, method, url, body, headers) {
  const req = makeReq(method, url, body, headers);
  const res = makeRes();
  const finished = new Promise(resolve => res.done = resolve);
  await handler(req, res);
  await finished;
  return res;
}
function response(status, data, extraHeaders = {}) {
  return new Response(typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data), {
    status,
    headers: { 'Content-Type':'application/json', ...extraHeaders }
  });
}

(async () => {
  const sampleRow = {
    id: 88,
    title: 'Fast Ad',
    description: 'A small metadata response',
    price: 1000,
    category_id: 'vehicles',
    status: 'approved',
    condition: 'used',
    created_at: '2026-07-15T00:00:00Z',
    phone: '94771234567',
    custom_fields: { district:'Kandy', city:'Kandy', category_slug:'vehicles' }
  };

  global.fetch = async (url) => {
    if (String(url).includes('/rest/v1/ads?')) return response(200, [sampleRow]);
    throw new Error(`Unexpected fetch ${url}`);
  };
  delete require.cache[require.resolve('./api/public-ads')];
  const publicAds = require('./api/public-ads');
  let result = await invoke(publicAds, 'GET', '/api/public-ads?limit=20');
  let parsed = JSON.parse(result.body);
  if (result.statusCode !== 200 || parsed.ads[0].image_url !== '/api/ad-image?id=88&index=0') throw new Error('Public ads metadata/proxy test failed.');
  if (JSON.stringify(parsed).includes('data:image')) throw new Error('Public ads leaked Base64 image data.');

  delete require.cache[require.resolve('./api/public-ad')];
  const publicAd = require('./api/public-ad');
  result = await invoke(publicAd, 'GET', '/api/public-ad?id=88');
  parsed = JSON.parse(result.body);
  if (result.statusCode !== 200 || parsed.ad.images[0] !== '/api/ad-image?id=88&index=0') throw new Error('Public ad metadata/proxy test failed.');

  const tiny = Buffer.from('tiny-image');
  global.fetch = async (url) => {
    if (String(url).includes('/rest/v1/ads?')) return response(200, [{ image_url:`data:image/png;base64,${tiny.toString('base64')}`, images:[] }]);
    throw new Error(`Unexpected image fetch ${url}`);
  };
  delete require.cache[require.resolve('./api/ad-image')];
  const adImage = require('./api/ad-image');
  result = await invoke(adImage, 'GET', '/api/ad-image?id=88&index=0');
  if (result.statusCode !== 200 || String(result.body) !== 'tiny-image' || result.headers['content-type'] !== 'image/png') throw new Error('Legacy Base64 image proxy test failed.');

  const { makeToken } = require('./lib/otp-utils');
  const phoneProof = makeToken({
    kind:'ad_contact_phones_verified', verified:true, phones:['94771234567'], expiresAt:Date.now()+60000
  });
  let inserted = null;
  global.fetch = async (url, options = {}) => {
    const target = String(url);
    if (target.endsWith('/auth/v1/user')) return response(200, { id:'user-1', user_metadata:{ name:'Test Seller' } });
    if (target.endsWith('/storage/v1/bucket')) return response(409, { message:'Already exists' });
    if (target.includes('/storage/v1/object/ad-images/')) return response(200, { Key:'ok' });
    if (target.includes('/rest/v1/categories')) return response(200, [{ id:'cat-1', name:'Cars', slug:'cars' }]);
    if (target.includes('/rest/v1/districts')) return response(200, [{ id:'dist-1', name:'Kandy', slug:'kandy' }]);
    if (target.includes('/rest/v1/cities')) return response(200, [{ id:'city-1', name:'Kandy', district_id:'dist-1' }]);
    if (target.endsWith('/rest/v1/ads') && options.method === 'POST') {
      inserted = JSON.parse(options.body);
      return response(201, [{ id:99, ...inserted, created_at:'2026-07-15T00:00:00Z' }]);
    }
    throw new Error(`Unexpected publish fetch ${target}`);
  };
  delete require.cache[require.resolve('./api/publish-ad')];
  const publishAd = require('./api/publish-ad');
  const image = `data:image/png;base64,${tiny.toString('base64')}`;
  result = await invoke(publishAd, 'POST', '/api/publish-ad', {
    title:'Stored Image Ad', description:'A real description', price:'2500',
    phones:['94771234567'], phoneProof, district:'Kandy', city:'Kandy',
    categoryId:'vehicles', subcategoryId:'cars', categoryName:'Vehicles', subcategoryName:'Cars',
    images:[image], customFields:{}
  }, { authorization:'Bearer user-token' });
  parsed = JSON.parse(result.body);
  if (result.statusCode !== 200 || !inserted) throw new Error(`Publish failed: ${result.body}`);
  if (String(inserted.image_url).startsWith('data:image') || JSON.stringify(inserted.images).includes('data:image')) throw new Error('Publish still stores Base64 in ads table.');
  if (!String(inserted.image_url).includes('/storage/v1/object/public/ad-images/')) throw new Error('Publish did not store a Storage URL.');

  console.log('PERFORMANCE_ARCHITECTURE_TEST_PASSED');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
