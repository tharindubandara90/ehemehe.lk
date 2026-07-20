const fs = require('fs');
const path = require('path');
const assert = require('assert');

const source = fs.readFileSync(path.join(__dirname, 'public', 'index-filters.js'), 'utf8');
const functionStart = source.indexOf('  function injectSellerPhoneAboveCall()');
const functionEnd = source.indexOf('\n  let sellerRetryRoute', functionStart);
assert(functionStart >= 0 && functionEnd > functionStart, 'Seller phone injection function not found');
const block = source.slice(functionStart, functionEnd);

assert(block.includes("document.body.classList.contains('ehm-ad-detail-pending')"), 'Seller phone injection is not blocked during ad loading');
assert(block.includes("document.getElementById('ehmAdDetailPendingShell')"), 'Pending loading shell is not checked before seller phone injection');
assert(block.includes("const detailScope = document.querySelector('#root main, main')"), 'Seller phone discovery is not scoped to the page main content');
assert(block.includes("node.closest?.('#ehmSellerPhone, footer, header, nav')"), 'Footer/header/navigation telephone links are not excluded');
assert(block.includes('existing?.remove();'), 'Stale seller phone panel is not removed when no real seller card exists');
assert(source.includes("body.ehm-ad-detail-pending #ehmSellerPhone{display:none!important}"), 'CSS race guard does not hide seller phone during loading');

const beginStart = source.indexOf('  function beginDynamicDetailPending(expectedAdId');
const beginEnd = source.indexOf('\n  function finishDynamicDetailPending()', beginStart);
const beginBlock = source.slice(beginStart, beginEnd);
assert(beginBlock.includes("document.getElementById('ehmSellerPhone')?.remove?.();"), 'Entering loading state does not immediately remove a stale seller phone block');

console.log('AD_DETAIL_LOADING_FOOTER_PHONE_REGRESSION_TEST_PASSED');
