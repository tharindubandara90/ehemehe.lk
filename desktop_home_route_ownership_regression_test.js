const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('public/index.html', 'utf8');
const desktop = fs.readFileSync('public/desktop-home-exact.js', 'utf8');
const css = fs.readFileSync('public/css/desktop-home-exact.css', 'utf8');

const match = html.match(/<script id="ehm-desktop-home-exact-route">([\s\S]*?)<\/script>/);
assert(match, 'Desktop route ownership script is missing.');
const routeCode = match[1];

function evaluateRoute({ userAgent, mobile = false, maxTouchPoints = 0, screenWidth = 1920, screenHeight = 1080 }) {
  const classes = new Set();
  const attrs = {};
  const documentElement = {
    classList: { add: (...names) => names.forEach((name) => classes.add(name)) },
    setAttribute: (name, value) => { attrs[name] = value; }
  };
  const context = {
    location: { pathname: '/' },
    screen: { width: screenWidth, height: screenHeight },
    navigator: { userAgent, userAgentData: { mobile }, maxTouchPoints },
    document: { documentElement },
    window: {
      navigator: { userAgent, userAgentData: { mobile }, maxTouchPoints }
    }
  };
  context.window.window = context.window;
  context.window.screen = context.screen;
  context.window.location = context.location;
  context.window.document = context.document;
  vm.runInNewContext(routeCode, context);
  return { exact: context.window.__EHM_DESKTOP_HOME_EXACT, owner: context.window.__EHM_DESKTOP_HOME_OWNER, classes, attrs };
}

const desktopResult = evaluateRoute({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/150 Safari/537.36' });
assert.strictEqual(desktopResult.exact, true, 'A desktop must keep exact-home ownership independent of CSS viewport width.');
assert.strictEqual(desktopResult.owner, 'exact-compact-v7');
assert(desktopResult.classes.has('ehm-desktop-home-exact'));

const androidResult = evaluateRoute({ userAgent: 'Mozilla/5.0 (Linux; Android 15; Mobile) Chrome/150 Mobile Safari/537.36', mobile: true, maxTouchPoints: 5, screenWidth: 412, screenHeight: 915 });
assert.strictEqual(androidResult.exact, false, 'Physical mobile must retain the React mobile home.');

assert(!routeCode.includes('matchMedia'), 'Desktop route ownership must not depend on matchMedia.');
assert(!desktop.includes('location.reload()'), 'Desktop helper must never reload into the old React layout.');
assert(!desktop.includes('addEventListener?.(\'change\''), 'Desktop helper still listens for a breakpoint ownership change.');
assert(html.includes('id="ehm-desktop-home-owner-lock"'), 'The root/desktop host ownership lock is missing.');
assert(html.includes("script('/desktop-home-exact.min.js") && !html.includes("script('/desktop-home-exact.min.js?v=42c2701df10434b5', 'defer')"), 'Desktop helper must run synchronously after its host.');
assert(css.includes('html.ehm-desktop-home-exact #root{display:none!important}'), 'Desktop root hide is missing.');
assert(!css.includes('@media (min-width:1024px){\n  html.ehm-desktop-home-exact'), 'Exact desktop ownership is still trapped inside a volatile 1024px media query.');

console.log('DESKTOP_HOME_ROUTE_OWNERSHIP_REGRESSION_TEST_PASSED');
