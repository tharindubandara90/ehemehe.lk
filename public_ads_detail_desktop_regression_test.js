const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

const helper = fs.readFileSync('public/index-filters.js', 'utf8');
const bundle = fs.readFileSync('public/js/index-BsKly-Vj.js', 'utf8');
const server = fs.readFileSync('local-server.js', 'utf8');

// Root cause guard: the original React detail page still only knows bundled Ht ads.
assert(bundle.includes('Ht.find(v=>v.id===i)'), 'Expected bundled-only React ad lookup was not found');
assert(bundle.includes('Ad not found'), 'Expected React not-found branch was not found');

// Listing and detail must use the exact database id in /ad/:id.
assert(helper.includes('const href = `/ad/${encodeURIComponent(ad.id)}`'), 'Cards do not link with the database ad id');
assert(helper.includes(".eq('id', cleanId)"), 'Detail route does not fetch the selected database ad id');
assert(helper.includes(".eq('status', 'approved')"), 'Public detail query is not restricted to approved ads');
assert(helper.includes(".select('*')"), 'Plain ads-table fallback query is missing');

// Dynamic Supabase detail must replace only the React not-found content, preserving layout/header/footer.
assert(helper.includes("String(node.textContent || '').trim() === 'Ad not found'"), 'Dynamic detail does not locate the React not-found state');
assert(helper.includes("target.id = 'ehmDynamicAdDetail'"), 'Dynamic detail host is not installed');
assert(helper.includes('Category Details'), 'Category-specific public details are missing');
assert(helper.includes('Contact Seller'), 'Seller contact block is missing');
assert(helper.includes('data-ehm-detail-image'), 'Multi-image detail gallery is missing');
assert(helper.includes('body.ehm-ad-detail-pending #root main'), 'Database ad route does not hide the temporary React not-found main area');
assert(helper.includes('beginDynamicDetailPending();'), 'Pre-paint database detail loading guard is not activated');
assert(helper.includes('cachePublicDetailAd(selected, { complete: false })'), 'Clicked live ad thumbnail cache is not marked incomplete before navigation');
assert(helper.includes('const routeAdPromise = loadAdForCurrentRoute();'), 'Selected ad is not fetched before background list/settings work');
assert(helper.includes('Promise.allSettled([loadFinanceSettings(), loadPromotions(), loadAds()])'), 'Non-critical ad detail work is not deferred to the background');

// The unfiltered desktop home keeps the existing Fresh recommendations section.
// Live database results are shown when search/category/location filters are active.
assert(helper.includes('renderDesktopResults(false, false);'), 'Desktop home still forces the separate Latest Ads host');
assert(!helper.includes('if (bannerAds.length) renderDesktopResults(true);'), 'Old banner-gated desktop rendering remains');

// UUID /ad routes must resolve to the SPA shell on local and Vercel server dispatch.
assert(server.includes("if (!path.extname(pathname)) filePath = path.join(publicDir, 'index.html');"), 'SPA route fallback is missing');

// Performance guard: no permanent polling loop was added for the fix.
assert(!/setInterval\s*\(/.test(helper), 'Permanent setInterval polling was introduced');

function instrumentSource(source) {
  const end = source.lastIndexOf('})();');
  assert(end > 0, 'Could not instrument helper closure');
  return source.slice(0, end) + `
  window.__ehmPublicAdsTest = {
    normalizeAd,
    dynamicDetailHtml,
    loadAds,
    loadAdForCurrentRoute,
    cachePublicDetailAd,
    readPublicDetailAd,
    beginDynamicDetailPending,
    finishDynamicDetailPending,
    isCompleteDetailAd
  };
` + source.slice(end);
}

function makeContext(pathname, supabaseClient, sharedSessionStorage = null) {
  const sessionMap = sharedSessionStorage || new Map();
  const context = {
    console,
    setTimeout,
    clearTimeout,
    requestAnimationFrame: (fn) => setTimeout(fn, 0),
    URLSearchParams,
    Date,
    Map,
    Set,
    JSON,
    Math,
    Promise,
    encodeURIComponent,
    decodeURIComponent,
    location: { pathname, search: '', hash: '' },
    history: { pushState() {}, replaceState() {}, scrollRestoration: 'auto' },
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    sessionStorage: {
      getItem(key) { return sessionMap.has(key) ? sessionMap.get(key) : null; },
      setItem(key, value) { sessionMap.set(key, String(value)); },
      removeItem(key) { sessionMap.delete(key); }
    },
    document: {
      readyState: 'loading',
      addEventListener() {},
      getElementById() { return null; },
      querySelector() { return null; },
      querySelectorAll() { return []; },
      head: { appendChild() {} },
      body: { classList: { add() {}, remove() {} } },
      documentElement: { scrollTop: 0, classList: { add() {}, remove() {} } },
      createElement() { return { id: '', className: '', style: {}, classList: { add() {}, remove() {}, toggle() {} }, appendChild() {}, setAttribute() {} }; }
    },
    MutationObserver: class { observe() {} disconnect() {} },
    navigator: {},
    screen: { width: 1280, height: 800 },
    innerWidth: 1280,
    innerHeight: 800,
    scrollTo() {},
    getComputedStyle() { return { display: 'block', visibility: 'visible' }; }
  };
  context.window = context;
  context.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  context.window.supabaseClient = supabaseClient;
  vm.createContext(context);
  vm.runInContext(instrumentSource(helper), context, { filename: 'index-filters.instrumented.js' });
  return context;
}

const DB_AD = {
  id: '8e95d6f0-a25e-41cc-a234-databasead01',
  title: 'Database Honda Aqua',
  description: 'A complete database-backed public listing.',
  price: 4250000,
  currency: 'LKR',
  status: 'approved',
  condition: 'used',
  created_at: '2026-07-16T08:00:00Z',
  image_url: 'https://example.test/aqua.jpg',
  images: ['https://example.test/aqua.jpg', 'https://example.test/aqua-2.jpg'],
  phone: '+94771234567',
  custom_fields: {
    owner_name: 'Test Seller',
    category_name: 'Vehicles',
    subcategory_name: 'Cars',
    category_slug: 'vehicles',
    subcategory_slug: 'cars',
    district: 'Kandy',
    city: 'Nawalapitiya',
    contact_phones: ['+94771234567'],
    brand: 'Honda',
    model: 'Aqua',
    mileage: '36000',
    fuel_type: 'Hybrid',
    transmission: 'Automatic'
  }
};

function queryClient({ relationshipError = false } = {}) {
  let relationshipAttempts = 0;
  let plainAttempts = 0;
  return {
    counts: () => ({ relationshipAttempts, plainAttempts }),
    from(table) {
      let selected = '';
      const filters = [];
      const query = {
        select(value) { selected = value; return query; },
        eq(key, value) { filters.push([key, value]); return query; },
        order() { return query; },
        limit() { return query; },
        in() { return query; },
        then(resolve) {
          if (table !== 'ads') return resolve({ data: [], error: null });
          if (selected.includes('categories(')) {
            relationshipAttempts += 1;
            if (relationshipError) return resolve({ data: null, error: { message: 'relationship missing' } });
          } else {
            plainAttempts += 1;
          }
          const matches = filters.every(([key, value]) => String(DB_AD[key]) === String(value));
          return resolve({ data: matches ? [DB_AD] : [], error: null });
        }
      };
      return query;
    }
  };
}

(async () => {
  // Functional normalization and public detail HTML test.
  const directClient = queryClient();
  const detailContext = makeContext(`/ad/${DB_AD.id}`, directClient);
  const api = detailContext.__ehmPublicAdsTest;
  const normalized = api.normalizeAd(DB_AD, 'supabase');
  assert.strictEqual(normalized.id, DB_AD.id);
  assert.strictEqual(normalized.categoryName, 'Cars');
  assert.strictEqual(normalized.cityName, 'Nawalapitiya');
  assert.deepStrictEqual(Array.from(normalized.contactPhones), ['+94771234567']);

  const html = api.dynamicDetailHtml(normalized);
  assert(html.includes('Database Honda Aqua'));
  assert(html.includes('Category Details'));
  assert(html.includes('Honda'));
  assert(html.includes('36000'));
  assert(html.includes('Contact Seller'));
  assert(html.includes('+94 77 123 4567'));
  assert(html.includes('Down Payment'));
  assert(html.includes('data-ehm-detail-image'));

  const routed = await api.loadAdForCurrentRoute();
  assert(routed && routed.id === DB_AD.id, 'Direct /ad/:id database lookup failed');

  // A listing clicked from the home grid must be available synchronously on
  // the next /ad/:id page, so the temporary React not-found branch never appears.
  const sharedSession = new Map();
  const cacheWriter = makeContext('/', null, sharedSession);
  const cachedNormalized = cacheWriter.__ehmPublicAdsTest.normalizeAd(DB_AD, 'supabase');
  assert.strictEqual(cacheWriter.__ehmPublicAdsTest.cachePublicDetailAd(cachedNormalized), true);
  const cacheReader = makeContext(`/ad/${DB_AD.id}`, null, sharedSession);
  const instant = await cacheReader.__ehmPublicAdsTest.loadAdForCurrentRoute();
  assert(instant && instant.id === DB_AD.id, 'Session-cached selected ad was not restored instantly');
  assert.strictEqual(instant.title, DB_AD.title);

  // Functional relationship-query fallback test used by mobile and desktop lists.
  const fallbackClient = queryClient({ relationshipError: true });
  const listContext = makeContext('/', fallbackClient);
  const rows = await listContext.__ehmPublicAdsTest.loadAds();
  assert.strictEqual(rows.length, 1, 'Plain ads fallback did not return the live listing');
  const counts = fallbackClient.counts();
  assert.strictEqual(counts.relationshipAttempts, 1, 'Relationship query was not attempted once');
  assert.strictEqual(counts.plainAttempts, 1, 'Plain ads fallback was not attempted once');

  // Categories where condition is not relevant must not be forced to New.
  const property = api.normalizeAd({ ...DB_AD, id: 'property-id', condition: null, custom_fields: { ...DB_AD.custom_fields, category_name: 'Property', category_slug: 'property', subcategory_name: 'Land', subcategory_slug: 'land' } }, 'supabase');
  const propertyHtml = api.dynamicDetailHtml(property);
  assert(!propertyHtml.includes('>New<'), 'A missing condition was incorrectly displayed as New');

  console.log('Public ads desktop/detail regression checks passed.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
