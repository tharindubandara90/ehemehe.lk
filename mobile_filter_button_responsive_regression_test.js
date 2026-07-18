const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'public', 'index-filters.js');
const source = fs.readFileSync(file, 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(source.includes('font-size:clamp(12.5px,3.7vw,14.5px)!important'), 'Mobile filter text must scale with viewport width.');
assert(source.includes('line-height:1.3!important'), 'Mobile filter button line-height must prevent glyph clipping.');
assert(source.includes('min-height:1.35em!important'), 'Mobile filter labels need reserved text height.');
assert(source.includes('padding-block:.08em!important'), 'Mobile filter labels need vertical glyph breathing room.');
assert(source.includes('@media(max-width:340px)'), 'Very narrow phones need a dedicated compact rule.');
assert(!source.includes('.ehm-pill{height:44px!important;border:2px solid #d4dce5!important;border-radius:999px!important;background:#fff!important;color:#1f2937!important;display:grid!important;grid-template-columns:minmax(0,max-content) 16px!important;align-items:center!important;justify-content:center!important;column-gap:7px!important;min-width:0!important;padding:0 12px!important;font-size:14.5px!important;font-weight:750!important;letter-spacing:-.01em!important;line-height:1!important'), 'Old clipped line-height rule must not remain.');

console.log('Mobile filter button responsive regression test passed.');
