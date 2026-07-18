const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
const index = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
const filters = fs.readFileSync(path.join(root, 'public/index-filters.js'), 'utf8');
const auth = fs.readFileSync(path.join(root, 'public/auth-unified.js'), 'utf8');
const gate = fs.readFileSync(path.join(root, 'public/post-auth-gate.js'), 'utf8');
const dispatcher = fs.readFileSync(path.join(root, 'lib/api-dispatcher.js'), 'utf8');
const homeHandler = fs.readFileSync(path.join(root, 'api-handlers/public-home.js'), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const gateIndex = index.indexOf('/post-auth-gate.js');
const bootstrapIndex = index.indexOf('ehm-public-home-bootstrap');
const reactIndex = index.indexOf("import('/js/index-BsKly-Vj.js");
const filtersIndex = index.indexOf('./index-filters.js');
const supabaseCdnIndex = index.indexOf('cdn.jsdelivr.net/npm/@supabase/supabase-js');

assert(gateIndex >= 0 && gateIndex < reactIndex, 'Post auth gate must load before the React application.');
assert(bootstrapIndex >= 0 && bootstrapIndex < reactIndex, 'Public home request must start before React imports.');
assert(filtersIndex >= 0 && filtersIndex < supabaseCdnIndex, 'Home renderer must start before the Supabase CDN dependency.');
assert(!/await\s+window\.EHM_SMS\.whenReady\(\)\s*;\s*await\s+import/.test(index), 'React boot must not wait for SMS settings.');
assert(index.includes("!window.__EHM_BLOCK_APP_BOOT"), 'React boot must be blocked during a signed-out post redirect.');

assert(filters.includes("fetch('/api/public-home?limit=80'"), 'Home data must use the combined public-home endpoint.');
assert(filters.includes('loadAds(),\n        loadPromotions()'), 'Critical first paint must wait only for ads and promotions.');
assert(filters.includes('refreshDeferredHomeData()'), 'Lookups and finance must refresh after the critical listing paint.');
assert(filters.includes('waitForDeferredSupabase'), 'Deferred Supabase data must wait safely for the client.');

assert(dispatcher.includes("'/api/public-home'"), 'The single API dispatcher must expose public-home.');
assert(homeHandler.includes('Promise.allSettled'), 'Public-home must fetch ads and promotion data in parallel.');
assert(homeHandler.includes("ad_promotions?select=*&order=created_at.desc"), 'Public-home must include all featured/promoted rows.');

const returnCalls = (auth.match(/location\.replace\(safeReturnTarget\(\)\)/g) || []).length;
assert(returnCalls >= 2, 'Both login and signup must return directly to the requested Post Ad route.');
assert(gate.includes("return `/signup?returnTo="), 'Signed-out Post Ad navigation must preserve a returnTo target.');
assert(gate.includes("path === '/post' || path === '/post-ad'"), 'Both canonical and legacy Post Ad routes must be guarded.');

function runGate({ session = null, pathname = '/post', search = '', hash = '' } = {}) {
  let replaced = '';
  const storage = new Map();
  if (session) storage.set('ehemehe-auth', JSON.stringify(session));

  const listeners = {};
  const context = {
    window: null,
    location: {
      href: `https://ehemehe.lk${pathname}${search}${hash}`,
      origin: 'https://ehemehe.lk',
      pathname,
      search,
      hash,
      replace(value) { replaced = value; }
    },
    localStorage: {
      getItem(key) { return storage.get(key) || null; }
    },
    document: {
      documentElement: { classList: { add() {} } },
      addEventListener(type, fn) { listeners[type] = fn; }
    },
    history: {
      pushState() {},
      replaceState() {}
    },
    URL,
    Object,
    JSON,
    encodeURIComponent,
    console
  };
  context.window = context;
  vm.runInNewContext(gate, context, { filename: 'post-auth-gate.js' });
  return { replaced, context };
}

const signedOut = runGate();
assert(signedOut.replaced === '/signup?returnTo=%2Fpost', 'A signed-out direct Post Ad visit must redirect immediately to signup.');
assert(signedOut.context.__EHM_BLOCK_APP_BOOT === true, 'Signed-out redirect must block the Post Ad app from flashing.');

const signedIn = runGate({ session: { access_token: 'token', refresh_token: 'refresh', user: { id: 'u1' } } });
assert(signedIn.replaced === '', 'A stored signed-in session must be allowed into Post Ad.');

console.log('Fast home bootstrap and Post Ad auth-return regression test passed.');
