const assert = require('assert');
const fs = require('fs');

const filters = fs.readFileSync('public/index-filters.js', 'utf8');
const report = fs.readFileSync('public/report-fixes.js', 'utf8');

assert(
  filters.includes('/Latest Ads|Fresh recommendations|Featured Ads|Browse Categories|'),
  'The original Fresh recommendations section is not hidden on managed mobile home.'
);
assert(
  filters.includes("body.ehm-home-mobile-ready #root section[data-ehm-mobile-hidden=\"1\"]"),
  'Managed mobile home does not keep original sections hidden.'
);
assert(
  report.includes(".ehm-mobile-favorites-link, .ehm-mobile-bottom-nav a[href=\"/dashboard/favorites\"]"),
  'Mobile Favorites navigation is not explicitly intercepted.'
);
assert(
  report.includes("window.location.assign('/dashboard/favorites')"),
  'Mobile Favorites does not perform a clean navigation to the Favorites view.'
);
assert(
  report.includes('event.stopImmediatePropagation?.();'),
  'Mobile Favorites click is not isolated from the original React navigation handler.'
);
assert(!/setInterval\s*\(/.test(report), 'The fix must not introduce permanent polling.');

console.log('Mobile Favorites navigation + duplicate recommendations regression test passed.');
