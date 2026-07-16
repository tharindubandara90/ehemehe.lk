const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

function leaf(text) {
  return { textContent: text, children: [], parentElement: null };
}
function card(labelText, valueText) {
  const label = leaf(labelText);
  const value = leaf(valueText);
  const parent = { children: [label, value], parentElement: null };
  label.parentElement = parent;
  value.parentElement = parent;
  return { label, value, parent };
}

const cards = [
  card('Category', 'Vehicles › Cars'),
  card('Title', 'Toyota Aqua 2015'),
  card('Description', 'Well maintained hybrid car'),
  card('Price', 'LKR 6,500,000'),
  card('Condition', 'Used'),
  card('Location', 'Nawalapitiya, Kandy'),
  card('Phone', '94703292070')
];
const reviewContainer = {
  querySelectorAll(selector) {
    if (selector === 'div,span') return cards.flatMap((row) => [row.label, row.value]);
    if (selector === 'label') return [];
    return [];
  }
};
const reviewHeading = { textContent: 'Review Your Ad', parentElement: reviewContainer };

const sessionStorage = new MemoryStorage();
const localStorage = new MemoryStorage();
sessionStorage.setItem('ehemehe:reactPostDraft:v1', JSON.stringify({
  category: {
    categoryId: 'vehicles',
    categoryName: 'Vehicles',
    subcategoryId: 'cars',
    subcategoryName: 'Cars'
  },
  details: {
    title: 'Toyota Aqua 2015',
    description: 'Well maintained hybrid car',
    price: '6500000',
    condition: 'used'
  },
  contact: { email: 'seller@example.com' }
}));
sessionStorage.setItem('ehemehe:nativePostLocation:v2', JSON.stringify({
  district: 'Kandy',
  city: 'Nawalapitiya'
}));

const document = {
  documentElement: {},
  querySelectorAll(selector) {
    if (selector === 'h1,h2,h3') return [reviewHeading];
    if (selector === '[data-ehm-field]') return [];
    return [];
  },
  querySelector() { return null; },
  getElementById() { return null; },
  addEventListener() {}
};

const windowObject = {
  __EHM_ENABLE_TEST_HOOKS__: true,
  addEventListener() {},
  dispatchEvent() {},
  setTimeout() { return 0; },
  clearTimeout() {},
  supabaseClient: null
};

const context = {
  window: windowObject,
  document,
  sessionStorage,
  localStorage,
  location: { pathname: '/post', search: '', hash: '', replace() {} },
  history: { pushState() {}, replaceState() {} },
  Event: class Event {},
  CustomEvent: class CustomEvent {},
  MutationObserver: class MutationObserver { observe() {} disconnect() {} },
  HTMLSelectElement: class HTMLSelectElement {},
  HTMLInputElement: class HTMLInputElement {},
  requestAnimationFrame() {},
  setTimeout() { return 0; },
  clearTimeout() {},
  console,
  fetch: async () => ({ ok: true, json: async () => ({}) })
};
windowObject.window = windowObject;
windowObject.document = document;
windowObject.sessionStorage = sessionStorage;
windowObject.localStorage = localStorage;
windowObject.location = context.location;
windowObject.history = context.history;
windowObject.Event = context.Event;
windowObject.CustomEvent = context.CustomEvent;
windowObject.MutationObserver = context.MutationObserver;
windowObject.requestAnimationFrame = context.requestAnimationFrame;

vm.runInNewContext(fs.readFileSync('public/post-ad-runtime.js', 'utf8'), context);
const hooks = windowObject.__EHM_POST_RUNTIME_TEST__;
assert(hooks, 'Post runtime test hooks were not installed.');

assert.deepStrictEqual(JSON.parse(JSON.stringify(hooks.selectedCategory())), {
  categoryId: 'vehicles',
  categoryName: 'Vehicles',
  subcategoryId: 'cars',
  subcategoryName: 'Cars'
});
assert.deepStrictEqual(JSON.parse(JSON.stringify(hooks.collectDetails())), {
  title: 'Toyota Aqua 2015',
  description: 'Well maintained hybrid car',
  price: '6500000',
  condition: 'used'
});
assert.deepStrictEqual(JSON.parse(JSON.stringify(hooks.collectContact())), {
  email: 'seller@example.com',
  district: 'Kandy',
  city: 'Nawalapitiya'
});

sessionStorage.setItem('ehemehe:reactPostDraft:v1', JSON.stringify({
  category: { categoryId: 'vehicles', subcategoryId: 'cars' }
}));
assert.deepStrictEqual(JSON.parse(JSON.stringify(hooks.collectDetails())), {
  title: 'Toyota Aqua 2015',
  description: 'Well maintained hybrid car',
  price: '6500000',
  condition: 'used'
});

const runtimeSource = fs.readFileSync('public/post-ad-runtime.js', 'utf8');
assert(runtimeSource.includes("const POST_DRAFT_KEY = 'ehemehe:reactPostDraft:v1'"));
assert(runtimeSource.includes('if (heading(\'Ad Details\')) captureBaseDetails();'));
assert(runtimeSource.includes('sessionStorage.removeItem(POST_DRAFT_KEY);'));
assert(!runtimeSource.includes("const container = heading('Ad Details')?.parentElement ||\n      heading('Review Your Ad')?.parentElement;"));

console.log('POST_AD_REVIEW_PUBLISH_STATE_TEST_PASSED');
