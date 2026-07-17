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
assert(filtersJs.includes('width:min(100%,560px);max-width:560px'), 'Hero dropdown row must use compact balanced width');
assert(filtersJs.includes('grid-template-columns:repeat(2,minmax(0,1fr))'), 'Hero dropdowns must remain equal width');

console.log('Desktop account and hero control balance regression checks passed.');
