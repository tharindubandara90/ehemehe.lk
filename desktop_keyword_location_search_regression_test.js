const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

const source = fs.readFileSync('public/index-filters.js', 'utf8');
const css = fs.readFileSync('public/brand-theme.css', 'utf8');
const theme = fs.readFileSync('public/brand-theme.js', 'utf8');

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  assert(start >= 0, `Missing ${name}`);
  const brace = source.indexOf('{', start);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = brace; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`Could not extract ${name}`);
}

const ads = [
  { id: 'tv-kandy', title: 'Samsung Smart TV', description: '55 inch television', categoryName: 'Electronics', categoryId: 'electronics', location: 'Kandy' },
  { id: 'tv-colombo', title: 'LG OLED TV', description: '4K television', categoryName: 'Electronics', categoryId: 'electronics', location: 'Colombo' },
  { id: 'car-kandy', title: 'Toyota Aqua', description: 'Hybrid car', categoryName: 'Vehicles', categoryId: 'vehicles', location: 'Kandy' }
];

const context = {
  state: { category: { id: 'vehicles' }, district: null, city: null },
  query: 'tv',
  ads,
  isMobile: () => false,
  isHomeRoute: () => true,
  getSearchValue: () => context.query,
  allAds: () => ads,
  sortAdsForPlacement: (rows) => rows,
  adMatchesSearch: (ad) => context.adMatchesSearchQuery(ad, context.query),
  adMatchesLocation: (ad) => {
    if (context.state.city) return String(ad.location).toLowerCase() === String(context.state.city.name).toLowerCase();
    if (context.state.district) return String(ad.location).toLowerCase() === String(context.state.district.name).toLowerCase();
    return true;
  },
  adMatchesCategory: (ad) => String(ad.categoryId) === String(context.state.category?.id || '')
};
vm.createContext(context);
vm.runInContext(`${extractFunction('searchWords')}\n${extractFunction('adMatchesSearchQuery')}\n${extractFunction('filteredAds')}\nthis.searchWords=searchWords;this.adMatchesSearchQuery=adMatchesSearchQuery;this.filteredAds=filteredAds;`, context);

let rows = context.filteredAds();
assert.deepStrictEqual(Array.from(rows, (ad) => ad.id).sort(), ['tv-colombo', 'tv-kandy'], 'TV search without a location must search all categories and all locations');

context.state.district = { name: 'Kandy' };
rows = context.filteredAds();
assert.deepStrictEqual(Array.from(rows, (ad) => ad.id), ['tv-kandy'], 'TV search with Kandy selected must return only Kandy TV ads');

context.query = '';
context.state.district = null;
rows = context.filteredAds();
assert.deepStrictEqual(Array.from(rows, (ad) => ad.id), ['car-kandy'], 'With no text query, an existing category shortcut filter must still work');

assert(source.includes("searchBar.querySelectorAll('.ehm-olx-category-field, .ehm-desktop-top-category').forEach((node) => node.remove())"), 'Desktop category selector cleanup is missing');
assert(source.includes('const desktopKeywordSearch = !isMobile() && isHomeRoute() && !!getSearchValue();'), 'Global desktop keyword search guard is missing');
assert(source.includes('prepareDesktopKeywordSearch(heroInput);'), 'Desktop location changes must preserve global keyword search behavior');
assert(!theme.includes("categorySelect.innerHTML = '<option value=\"\">All categories</option>'"), 'Theme still injects the removed desktop category selector');
assert(!theme.includes("params.set('category', category)"), 'Desktop fallback search still submits a category constraint');
assert(css.includes('grid-template-columns: minmax(520px, 1.75fr) minmax(260px, .85fr) 152px !important;'), 'Desktop search bar is not rebalanced to query/location/search');
assert(css.includes('body.ehm-desktop-olx-home .ehm-olx-category-field {\n    display: none !important;'), 'Stale cached category fields are not hidden');

console.log('DESKTOP_KEYWORD_LOCATION_SEARCH_REGRESSION_TEST_PASSED');
