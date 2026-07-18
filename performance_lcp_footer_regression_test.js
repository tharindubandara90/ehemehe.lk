const assert = require('assert');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const zlib = require('zlib');

const read = (file) => fs.readFileSync(file, 'utf8');
const html = read('public/index.html');
const bundle = read('public/js/index-BsKly-Vj.js');
const filters = read('public/index-filters.js');
const filtersMin = read('public/index-filters.min.js');
const mainCss = read('public/css/index-DcB2eYwd.css');
const enhancements = read('public/css/site-enhancements.css');
const desktopExactCss = read('public/css/desktop-home-exact.css');
const desktopExact = read('public/desktop-home-exact.js');
const appCss = read('public/css/ehemehe-app.min.css');
const publicHome = read('server-routes/public-home.js');
const publicMeta = read('server-routes/public-meta.js');
const publicImage = read('server-routes/public-ad-image.js');
const postRuntime = read('public/post-ad-runtime.js');
const publishApi = read('server-routes/publish-ad.js');
const server = read('server.js');
const pkg = JSON.parse(read('package.json'));

// Footer contains four actual children, so every tablet/desktop grid must also
// resolve to four real columns without a phantom fifth column.
assert(bundle.includes('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4'), 'Footer bundle grid is not 2/3/4 columns.');
assert(bundle.includes('col-span-2 md:col-span-3 lg:col-span-1'), 'Footer brand span does not match the 3-column tablet grid.');
assert(!bundle.includes('md:grid-cols-4 lg:grid-cols-5'), 'Old phantom fifth footer column remains.');
assert(enhancements.includes('grid-template-columns:minmax(220px,1.25fr) repeat(3,minmax(0,1fr))') ||
       enhancements.includes('grid-template-columns: minmax(220px, 1.25fr) repeat(3, minmax(0, 1fr))'),
       'Four-column desktop footer override is missing.');
assert(enhancements.includes('(min-width: 1024px) and (max-width: 1147px)'), 'Problematic footer breakpoint guard is missing.');

// Critical CSS should be a single, minified, cache-versioned request with no
// Google Fonts import dependency.
assert(!/@import\s+url\([^)]*fonts\.googleapis/i.test(mainCss), 'Google Fonts render-blocking import remains.');
assert(!/fonts\.googleapis|fonts\.gstatic/i.test(html), 'External font dependency remains in the home shell.');
const staticStyles = (html.match(/<link(?=[^>]+rel="stylesheet")(?=[^>]+href="\/css\/)[^>]*>/g) || []);
assert.strictEqual(staticStyles.length, 1, 'Home shell should have one unconditional render-blocking stylesheet.');
assert(/\/css\/ehemehe-app\.min\.css\?v=[a-f0-9]{12,64}/i.test(html), 'Combined CSS is not content-versioned.');
assert(appCss.length < mainCss.length + enhancements.length + desktopExactCss.length, 'Combined CSS was not minified.');

// Public home critical path is one lightweight list request. Heavy lookup and
// promotional metadata must not delay the first listing paint.
assert(publicHome.includes('const [ads, firstImageRows] = await Promise.all(['), 'Public home listing/first-thumbnail requests are not parallelized.');
assert(!publicHome.includes("rest('cities'"), 'City metadata still blocks the LCP endpoint.');
assert(publicHome.includes('prepareFirstPaintImage'), 'First LCP thumbnail is not delivered with the critical home response.');
assert(!publicHome.includes("rest('categories'"), 'Category metadata still blocks the LCP endpoint.');
assert(!/['"]images['"]/.test(publicHome.match(/const LIST_SELECT[\s\S]*?\.join\(','\);/)?.[0] || ''),
  'Public list query still downloads image arrays.');
assert(!/['"]image_url['"]/.test(publicHome.match(/const LIST_SELECT[\s\S]*?\.join\(','\);/)?.[0] || ''),
  'Public list query still downloads Base64 image_url values.');
assert(publicMeta.includes("rest('cities'"), 'Deferred public metadata endpoint is incomplete.');
assert(publicHome.includes('brotliCompressSync'), 'Critical home JSON compression is missing.');
assert(publicMeta.includes('brotliCompressSync'), 'Deferred metadata JSON compression is missing.');
assert(filters.includes("fetch('/api/public-home'"), 'Browser does not use the same-origin public home endpoint.');
assert(filters.includes("fetch('/api/public-meta'"), 'Deferred metadata endpoint is not used.');
assert(filters.includes("requestIdleCallback(refresh"), 'Non-critical metadata is not idle-scheduled.');

// No demo listing images should compete with the live first card, and the LCP
// image must be explicitly prioritized with stable dimensions.
assert(filters.includes('if (!adsLoaded) return [];'), 'Bundled demo images can still start before live ads resolve.');
assert(filters.includes('supabaseAds.length ? [...supabaseAds] : allStaticAds()'), 'Static ads are not restricted to offline fallback.');
assert(filters.includes("loading=\"${index === 0 ? 'eager' : 'lazy'}\""), 'First list image is not eager.');
assert(filters.includes("fetchpriority=\"${index === 0 ? 'high' : 'low'}\""), 'First list image is not high priority.');
assert(filters.includes('width="480" height="360"'), 'List image dimensions are not reserved.');
assert(filters.includes('listingSkeletonHtml'), 'Stable mobile listing skeleton is missing.');
assert(desktopExact.includes("loading=\"${index === 0 ? 'eager' : 'lazy'}\""), 'Desktop first list image is not eager.');
assert(desktopExact.includes("fetchpriority=\"${index === 0 ? 'high' : 'low'}\""), 'Desktop first list image is not high priority.');
assert(desktopExact.includes('width=\"480\" height=\"360\"'), 'Desktop list image dimensions are not reserved.');

// List images are generated from a dedicated thumbnail and old oversized rows
// are resized server-side to WebP without reading full image arrays by default.
assert(postRuntime.includes('THUMBNAIL_STATE_KEY'), 'Post Ad thumbnail state is missing.');
assert(postRuntime.includes("canvas.toDataURL('image/webp'"), 'Post Ad does not generate a WebP thumbnail.');
assert(publishApi.includes('thumbnail || images[0]'), 'Publish API does not store the generated thumbnail.');
assert(publicImage.includes("select: 'image_url,status'"), 'List-image endpoint still requests complete image arrays first.');
assert(publicImage.includes('.resize(480, 360'), 'Server-side list image resizing is missing.');
assert(publicImage.includes(".webp({ quality: 68"), 'Server-side WebP conversion is missing.');

// Route-scoped resources, long-lived hashed assets and compressed static files.
assert(!/<script[^>]+sms-verification-service\.js[^>]+defer data-ehm-unified-sms="primary"/i.test(html),
  'SMS verification service still loads on every public home visit.');
assert(html.includes('var needsSms ='), 'SMS service is not route-scoped.');
assert(html.includes('ehm-lazy-supabase-sdk'), 'Supabase SDK lazy loader is missing.');
assert(server.includes("'/api/public-home': publicHome"), 'Public home API is not routed by the local/Vercel server.');
assert(server.includes("'/api/public-meta': publicMeta"), 'Public metadata API is not routed by the local/Vercel server.');
assert(server.includes("'/api/public-ad-image': publicAdImage"), 'Public image API is not routed by the local/Vercel server.');
assert(server.includes('brotliCompress'), 'Brotli static compression is missing.');
assert(server.includes("res.setHeader('ETag'"), 'Static ETag revalidation is missing.');
assert(pkg.dependencies?.sharp, 'Sharp production dependency is missing.');
assert(pkg.devDependencies?.['clean-css'], 'CSS build dependency is missing.');
assert(pkg.devDependencies?.terser, 'JavaScript minifier dependency is missing.');
assert(pkg.scripts?.['prepare-assets']?.includes('build-css'), 'CSS optimization is not part of the build.');
assert(pkg.scripts?.['prepare-assets']?.includes('build-public-js'), 'Public JavaScript optimization is not part of the build.');
assert(/\/index-filters\.min\.js\?v=[a-f0-9]{12,64}/i.test(html), 'Minified public route helper is not loaded/versioned.');
assert(filtersMin.length < filters.length, 'Public route helper was not minified.');
assert(/index-filters\.min\.js[^>]*defer/i.test(html), 'Public home helper is still parser-blocking.');
assert(!/rel="preconnect"[^>]+images\.unsplash\.com/i.test(html), 'Unused third-party image preconnect remains on every route.');

// SPA navigation must remove home-only prepaint rules on other routes.
assert(filters.includes("else document.documentElement.classList.remove('ehm-home-route-prepaint');"),
  'Home prepaint class leaks into non-home SPA routes.');

// Optimized brand media must stay small enough not to compete with LCP.
assert(fs.statSync('public/assets/ehemehe_logo_header.webp').size < 25000, 'Header logo is still oversized.');
assert(fs.statSync('public/assets/ehemehe_favicon_64.png').size < 10000, 'Favicon is still oversized.');
assert(/ehemehe_logo_header\.webp\?v=[a-f0-9]{12,64}/i.test(html), 'Optimized logo is not preloaded/versioned.');

async function testPublicHomeCriticalResponse() {
  const handlerPath = path.resolve('server-routes/public-home.js');
  delete require.cache[handlerPath];
  const handler = require(handlerPath);
  const originalFetch = global.fetch;
  let requests = 0;
  const firstSource = await sharp({ create: { width: 1200, height: 900, channels: 3, background: '#24b889' } }).png().toBuffer();
  const directImage = `data:image/png;base64,${firstSource.toString('base64')}`;
  global.fetch = async (url) => {
    requests += 1;
    const requestUrl = String(url);
    assert(requestUrl.includes('/rest/v1/ads?'), 'Critical home endpoint requested a non-ads table.');
    const isFirstImageQuery = decodeURIComponent(requestUrl).includes('select=id,image_url,created_at,updated_at');
    return {
      ok: true,
      json: async () => isFirstImageQuery ? [{
        id: 'critical-ad-123456', image_url: directImage,
        created_at: '2026-07-18T00:00:00Z', updated_at: '2026-07-18T00:00:00Z'
      }] : [{
        id: 'critical-ad-123456', title: 'Critical ad', status: 'approved',
        created_at: '2026-07-18T00:00:00Z', updated_at: '2026-07-18T00:00:00Z'
      }]
    };
  };
  const chunks = [];
  const headers = {};
  const req = { method: 'GET', url: '/api/public-home', headers: { 'accept-encoding': 'br' } };
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
  assert.strictEqual(requests, 2, 'Critical home endpoint did not make exactly two parallel compact database requests.');
  assert.strictEqual(headers['content-encoding'], 'br', 'Critical home JSON was not Brotli-compressed.');
  const body = JSON.parse(zlib.brotliDecompressSync(Buffer.concat(chunks)).toString('utf8'));
  assert.strictEqual(body.ads.length, 1);
  assert(body.ads[0].image_url.startsWith('data:image/webp;base64,'), 'First LCP image was not converted and included in the critical home response.');
  const firstOutput = Buffer.from(body.ads[0].image_url.split(',')[1], 'base64');
  const firstMetadata = await sharp(firstOutput).metadata();
  assert.strictEqual(firstMetadata.width, 480, 'Inline first-paint thumbnail width is incorrect.');
  assert.strictEqual(firstMetadata.height, 360, 'Inline first-paint thumbnail height is incorrect.');
  assert(firstOutput.length < firstSource.length, 'Inline first-paint thumbnail is not smaller than its source.');
  assert.deepStrictEqual(body.ads[0].images, [], 'Critical home response exposed the full image array.');
}

async function testImageOptimization() {
  const handlerPath = path.resolve('server-routes/public-ad-image.js');
  delete require.cache[handlerPath];
  const handler = require(handlerPath);
  const source = await sharp({ create: { width: 1400, height: 1000, channels: 3, background: '#3dc697' } })
    .png()
    .toBuffer();
  const dataUrl = `data:image/png;base64,${source.toString('base64')}`;
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => [{ image_url: dataUrl, status: 'approved' }]
  });

  const chunks = [];
  const headers = {};
  const req = { method: 'GET', url: '/api/public-ad-image?id=test-ad-123456&v=1', headers: {} };
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
  const output = Buffer.concat(chunks);
  assert.strictEqual(res.statusCode, 200, 'Optimized image endpoint did not return 200.');
  assert.strictEqual(headers['content-type'], 'image/webp', 'Optimized image is not WebP.');
  const metadata = await sharp(output).metadata();
  assert.strictEqual(metadata.width, 480, 'Optimized list image width is incorrect.');
  assert.strictEqual(metadata.height, 360, 'Optimized list image height is incorrect.');
  assert(output.length < source.length, 'Optimized list image is not smaller than its source.');
}

(async () => {
  await testPublicHomeCriticalResponse();
  await testImageOptimization();
  console.log('Footer/LCP/network performance regression checks passed.');
})().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
