const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('public/index.html', 'utf8');
const filters = fs.readFileSync('public/index-filters.js', 'utf8');
const theme = fs.readFileSync('public/brand-theme.js', 'utf8');
const exact = fs.readFileSync('public/desktop-home-exact.js', 'utf8');
const css = fs.readFileSync('public/css/desktop-home-exact.css', 'utf8');

const match = html.match(/<script id="ehm-desktop-home-exact-route">([\s\S]*?)<\/script>/);
assert(match, 'Desktop owner decision must run in the document head.');

function ownerFor({ ua, mobile = false, touches = 0, width = 1920, height = 1080, path = '/' }) {
  const classes = new Set();
  const attrs = {};
  const documentElement = {
    classList: { add: (...names) => names.forEach((name) => classes.add(name)) },
    setAttribute: (name, value) => { attrs[name] = value; }
  };
  const navigator = { userAgent: ua, userAgentData: { mobile }, maxTouchPoints: touches };
  const context = {
    location: { pathname: path }, navigator, screen: { width, height },
    document: { documentElement }, window: { navigator }
  };
  Object.assign(context.window, { window: context.window, location: context.location, screen: context.screen, document: context.document });
  vm.runInNewContext(match[1], context);
  return { exact: context.window.__EHM_DESKTOP_HOME_EXACT, owner: context.window.__EHM_DESKTOP_HOME_OWNER, classes, attrs };
}

const desktop = ownerFor({ ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/150 Safari/537.36' });
assert.strictEqual(desktop.exact, true, 'Desktop home must have one permanent compact owner.');
assert(desktop.classes.has('ehm-desktop-home-exact'));

const mobile = ownerFor({ ua: 'Mozilla/5.0 (Linux; Android 15; Mobile) Chrome/150 Mobile', mobile: true, touches: 5, width: 412, height: 915 });
assert.strictEqual(mobile.exact, false, 'Mobile must keep the existing React view.');

assert(html.includes('!window.__EHM_AUTH_ONLY_ROUTE && !window.__EHM_DESKTOP_HOME_EXACT'), 'React bundle is still allowed to mount over desktop home.');
assert(html.includes('id="ehmDesktopHomeExact"'), 'Stable desktop host is missing.');
assert(html.includes('id="ehm-desktop-home-owner-lock"'), 'Desktop host/root lock is missing.');
assert(html.includes('src="/desktop-home-exact.min.js'), 'Stable desktop implementation is not loaded.');
assert(filters.includes('if (window.__EHM_DESKTOP_HOME_EXACT) return;'), 'Delayed index filter rewriter is not disabled on exact desktop home.');
assert(theme.includes('if (window.__EHM_DESKTOP_HOME_EXACT) return;'), 'Theme MutationObserver is not disabled on exact desktop home.');
assert(!exact.includes('location.reload('), 'Exact desktop helper must never reload into a competing view.');
assert(css.includes('html.ehm-desktop-home-exact #root{display:none!important}'), 'React root is not permanently hidden for exact desktop home.');
assert(css.includes('html.ehm-desktop-home-exact #ehmDesktopHomeExact{display:block'), 'Exact desktop host is not permanently visible.');

console.log('DESKTOP_VIEW_STABILITY_REGRESSION_TEST_PASSED');
