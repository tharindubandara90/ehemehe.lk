const fs = require('fs');
const assert = require('assert');

const themeJs = fs.readFileSync('public/brand-theme.js', 'utf8');
const themeCss = fs.readFileSync('public/brand-theme.css', 'utf8');
const filtersJs = fs.readFileSync('public/index-filters.js', 'utf8');

assert(themeJs.includes("accountLabel.textContent !== 'Account'"), 'Desktop account label must be normalized to Account');
assert(themeJs.includes("ehm-desktop-account-button"), 'Desktop account button enhancement is missing');
assert(themeCss.includes('.ehm-desktop-post-button,'), 'Post Ad and Account equal sizing rule is missing');
assert(themeCss.includes('width: 126px !important'), 'Desktop account/post width must stay balanced');
assert(themeCss.includes('background: #ffffff !important'), 'Account control must use white background');
assert(filtersJs.includes("searchBar.querySelectorAll('.ehm-olx-category-field, .ehm-desktop-top-category')"), 'Desktop category selector cleanup is missing');
assert(themeCss.includes('minmax(520px, 1.75fr) minmax(260px, .85fr) 152px'), 'Desktop query/location/search columns must remain balanced');

console.log('Desktop account and hero control balance regression checks passed.');
