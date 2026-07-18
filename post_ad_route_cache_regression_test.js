const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');

const index = fs.readFileSync('public/index.html', 'utf8');
const helper = fs.readFileSync('public/post-ad-category-fields.js', 'utf8');
const runtime = fs.readFileSync('public/post-ad-runtime.js', 'utf8');
const bundle = fs.readFileSync('public/js/index-BsKly-Vj.js', 'utf8');
const server = fs.readFileSync('local-server.js', 'utf8');

assert(helper.includes('function isPostRoute()'));
assert(!helper.includes("if (!['/post', '/post-ad'].includes(normalizedPath)) return;"));
assert(helper.includes('if (!isPostRoute()) return;'));
assert(!helper.includes('setInterval(scheduleTick, 900)'));
assert(!runtime.includes('setInterval(tick, 900)'));
assert(helper.includes("window.addEventListener('ehemehe:routechange', updateRouteLifecycle)"));
assert(helper.includes('observer.disconnect()'));
assert(runtime.includes("window.addEventListener('ehemehe:routechange', updateRuntimeLifecycle)"));
assert(runtime.includes("const isRuntimeRoute = () => isPostRoute() || route().startsWith('/dashboard');"));

assert(bundle.includes('data-ehm-native-district'));
assert(bundle.includes('data-ehm-native-city'));
assert(bundle.includes('setEhemeheCity'));
assert(bundle.includes('EhmVerifiedPhones'));
assert(bundle.includes('return U&&ehemeheCity&&ehemehePhonesReady'));

const requiredAssets = [
  '/sms-verification-service.js',
  '/js/index-BsKly-Vj.js',
  '/post-ad-category-fields.js',
  '/post-ad-runtime.js',
  '/auth-unified.js'
];
for (const url of requiredAssets) {
  const htmlUrl = url === '/post-ad-category-fields.js' ? './post-ad-category-fields.js' : url;
  const match = index.match(new RegExp(htmlUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\?v=([a-f0-9]{16})'));
  assert(match, `${htmlUrl} is not content-hash versioned`);
  const file = `public/${url.replace(/^\//, '')}`;
  const expected = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16);
  assert.strictEqual(match[1], expected, `${htmlUrl} version does not match its content`);
}

assert(server.includes('const contentHashedVersion = /^[a-f0-9]{12,64}$/i.test(assetVersion);'));
console.log('POST_AD_ROUTE_CACHE_REGRESSION_TEST_PASSED');
