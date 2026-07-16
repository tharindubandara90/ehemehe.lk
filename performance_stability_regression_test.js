const assert = require('assert');
const fs = require('fs');

const read = (file) => fs.readFileSync(file, 'utf8');
const category = read('public/post-ad-category-fields.js');
const runtime = read('public/post-ad-runtime.js');
const filters = read('public/index-filters.js');
const authBridge = read('public/auth-session-bridge.js');
const brand = read('public/brand-theme.js');
const adminBrand = read('public/admin/brand-theme.js');

// Category helper must not create a MutationObserver feedback loop by rewriting
// labels/review location with the same value on every pass.
assert(category.includes("if (label.textContent !== nextLabel) label.textContent = nextLabel;"),
  'Price label updates are not mutation guarded.');
assert(category.includes("if (valueNode.textContent !== nextLocation) valueNode.textContent = nextLocation;"),
  'Review location updates are not mutation guarded.');
assert(!category.includes('setInterval(scheduleTick, 900)'),
  'Category helper still has permanent rapid polling.');

// Runtime phone panel must preserve the live input and only rebuild on a real
// structural/status change. Required labels with a trailing * must normalize.
assert(runtime.includes("const labelKey = (value) => clean(clean(value).replace(/\\*/g, '')).toLowerCase();"),
  'Required-field label normalization regression.');
assert(runtime.includes('function phonePanelSignature()'),
  'Phone panel structural signature is missing.');
assert(runtime.includes('if (panel.dataset.signature !== signature)'),
  'Phone panel is rebuilt unconditionally.');
assert(runtime.includes('tickRunning: false') && runtime.includes('tickQueued: false'),
  'Runtime tick coalescing is missing.');
assert(!runtime.includes('setInterval(tick, 900)'),
  'Post Ad runtime still has permanent rapid polling.');

// Public route helpers must avoid observer -> innerHTML -> observer loops and
// only observe routes that need dynamic stabilization.
assert(filters.includes("if (existing.__ehmContent !== content)"),
  'Ad detail content rewrites are not guarded.');
assert(filters.includes('function needsRouteObserver()'),
  'Route-scoped observer lifecycle is missing.');
assert(filters.includes('routeObserver.disconnect()'),
  'Route observer is never disconnected.');
assert(!filters.includes('setInterval('),
  'Public filters still contain permanent polling.');

// Supabase boot wait must be bounded instead of retrying forever.
assert(!authBridge.includes('setTimeout(initialize'),
  'Auth bridge still recursively retries initialization forever.');
assert(authBridge.includes('waitForSupabaseClient(10000)'),
  'Auth bridge bounded Supabase wait is missing.');

// Theme observers should coalesce work to one animation frame.
for (const [name, source] of [['brand', brand], ['admin brand', adminBrand]]) {
  assert(source.includes('function scheduleTick()'), `${name} observer scheduler is missing.`);
  assert(source.includes('requestAnimationFrame(() =>'), `${name} DOM work is not frame-coalesced.`);
  assert(source.includes('new MutationObserver(scheduleTick)'), `${name} observer bypasses the scheduler.`);
}


// Generated route shells and intentional admin duplicates must stay synchronized.
const indexHtml = read('public/index.html');
const adShells = fs.readdirSync('public/ad', { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => `public/ad/${entry.name}/index.html`);
assert.strictEqual(adShells.length, 100, 'Unexpected number of static ad route shells.');
for (const shell of adShells) {
  assert.strictEqual(read(shell), indexHtml, `${shell} is stale or different from public/index.html.`);
}
assert.strictEqual(read('public/admin.js'), read('public/admin/admin.js'), 'Admin JavaScript duplicates are out of sync.');
assert.strictEqual(read('public/admin.html'), read('public/admin/index.html'), 'Admin HTML duplicates are out of sync.');
assert.strictEqual(read('public/supabase.js'), read('public/admin/supabase.js'), 'Supabase browser config duplicates are out of sync.');

console.log('Performance stability regression checks passed.');
