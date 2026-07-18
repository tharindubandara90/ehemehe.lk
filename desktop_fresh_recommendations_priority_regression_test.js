const fs = require('fs');
const assert = require('assert');

const js = fs.readFileSync('public/index-filters.js', 'utf8');
const css = fs.readFileSync('public/brand-theme.css', 'utf8');

assert(js.includes("heading === 'Latest Ads' || heading === 'Fresh recommendations'"), 'Fresh recommendations section detection is missing');
assert(js.includes("section.classList.contains('ehm-olx-latest-section')"), 'Stable recommendations section marker is missing');
assert(js.includes("if (active) section.style.setProperty('display', 'none', 'important')"), 'Filtered Search Results must temporarily hide recommendations');
assert(js.includes("else section.style.removeProperty('display')"), 'Unfiltered desktop home must restore Fresh recommendations');
assert(js.includes("browse.insertAdjacentElement('afterend', recommendations)"), 'Fresh recommendations must be directly below Browse Categories');
assert((js.match(/renderDesktopResults\(false, false\)/g) || []).length >= 2, 'Desktop home must not force the injected Latest Ads host');
assert(!js.includes('The Supabase-backed section is the only Latest Ads source'), 'Old forced Latest Ads ownership remains');

// Existing dimensions must stay unchanged.
assert(css.includes('body.ehm-desktop-olx-home .ehm-olx-latest-grid'), 'Existing recommendations grid CSS is missing');
assert(css.includes('grid-template-columns: repeat(4, minmax(0, 1fr)) !important;'), 'Existing four-column recommendations size changed');
assert(css.includes('aspect-ratio: 16 / 9 !important;'), 'Existing recommendation image ratio changed');

console.log('DESKTOP_FRESH_RECOMMENDATIONS_PRIORITY_REGRESSION_TEST_PASSED');
