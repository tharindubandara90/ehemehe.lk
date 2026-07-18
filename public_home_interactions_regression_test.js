const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { EventEmitter } = require('events');

const root = __dirname;
const publicUi = fs.readFileSync(path.join(root, 'public/index-filters.js'), 'utf8');
const mobileCss = fs.readFileSync(path.join(root, 'public/brand-theme.css'), 'utf8');
const server = fs.readFileSync(path.join(root, 'local-server.js'), 'utf8');
const reportSql = fs.readFileSync(path.join(root, 'supabase_public_interactions_schema.sql'), 'utf8');

function extractFunction(source, name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  assert(start >= 0, `Missing ${name}`);
  const brace = source.indexOf('{', start);
  assert(brace >= 0, `Missing opening brace for ${name}`);
  let depth = 0;
  let state = 'normal';
  let escaped = false;
  for (let i = brace; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];
    if (state === 'line') {
      if (ch === '\n') state = 'normal';
      continue;
    }
    if (state === 'block') {
      if (ch === '*' && next === '/') { state = 'normal'; i += 1; }
      continue;
    }
    if (state === 'single' || state === 'double' || state === 'template') {
      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if ((state === 'single' && ch === "'") || (state === 'double' && ch === '"') || (state === 'template' && ch === '`')) state = 'normal';
      continue;
    }
    if (ch === '/' && next === '/') { state = 'line'; i += 1; continue; }
    if (ch === '/' && next === '*') { state = 'block'; i += 1; continue; }
    if (ch === "'") { state = 'single'; continue; }
    if (ch === '"') { state = 'double'; continue; }
    if (ch === '`') { state = 'template'; continue; }
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`Could not extract ${name}`);
}

const pureSearch = `${extractFunction(publicUi, 'searchWords')}\n${extractFunction(publicUi, 'adMatchesSearchQuery')}\nthis.searchWords=searchWords;this.adMatchesSearchQuery=adMatchesSearchQuery;`;
const searchContext = {};
vm.createContext(searchContext);
vm.runInContext(pureSearch, searchContext);

const education = {
  title: 'A-Level Physics Tuition – Online',
  description: 'Experienced teacher',
  categoryName: 'Education',
  categoryId: 'education',
  subcategoryId: 'tuition-classes',
  location: 'Colombo',
  cityName: 'Colombo 03',
  districtId: 'colombo',
  customFields: {}
};
const property = {
  title: 'Modern 3-Bedroom House in Kandy',
  description: 'Great location near town',
  categoryName: 'Property',
  categoryId: 'property',
  subcategoryId: 'houses',
  location: 'Kandy',
  customFields: {}
};
const catAd = {
  title: 'British Shorthair Cat',
  description: 'Healthy kitten',
  categoryName: 'Animals & Pets',
  categoryId: 'animals-pets',
  subcategoryId: 'cats',
  location: 'Gampaha',
  customFields: { breed: 'British Shorthair' }
};
assert.strictEqual(searchContext.adMatchesSearchQuery(education, 'cat'), false, 'cat must not match education');
assert.strictEqual(searchContext.adMatchesSearchQuery(property, 'cat'), false, 'cat must not match location');
assert.strictEqual(searchContext.adMatchesSearchQuery(catAd, 'cat'), true, 'cat must match Cats/cat listing');
assert.strictEqual(searchContext.adMatchesSearchQuery(catAd, 'brit short'), true, 'multiple word-prefix tokens should match');
assert.strictEqual(searchContext.adMatchesSearchQuery(catAd, 'toyota'), false, 'unrelated token must reject');

assert(publicUi.includes('Hero → Browse Categories → Latest Ads.'), 'Desktop section order guard missing');
assert(publicUi.includes("heading === 'Featured Ads' || heading === 'Latest Ads'"), 'Bundled duplicate sections are not hidden');
assert(publicUi.includes("anchor.insertAdjacentElement('afterend', host)"), 'Latest Ads host is not placed after Browse Categories');
assert(publicUi.includes("locationField.classList.remove('ehm-desktop-native-location-hidden', 'ehm-desktop-top-location-hidden')"), 'Native hero location wrapper is not restored for the stable search grid');
assert(publicUi.includes("document.getElementById('ehmDesktopHeroFilterbar')?.remove()"), 'Legacy delayed hero overlay is not removed');
assert(publicUi.includes("searchBar.insertBefore(categoryField, locationField)"), 'Stable category field is not placed before native location field');
assert(publicUi.includes("location.dataset.ehmBound !== '1'"), 'Desktop location selector is not stably bound');
assert(publicUi.includes('background-position:right 15px center'), 'Desktop selector arrow alignment missing');

assert(publicUi.includes('data-ehm-favorite-id'), 'Favorite controls missing');
assert(publicUi.includes("toggleFavoriteId(favoriteButton.getAttribute('data-ehm-favorite-id'))"), 'Favorite delegated click handler missing');
assert(publicUi.includes("showUiToast(wasActive ? 'Removed from favourites' : 'Added to favourites')"), 'Favorite feedback missing');

assert(publicUi.includes('data-ehm-report-ad'), 'Report control missing');
assert(publicUi.includes("fetch('/api/report-ad'"), 'Report submit API call missing');
assert(fs.readFileSync('lib/api-dispatcher.js', 'utf8').includes("'/api/report-ad': () => require('../api-handlers/report-ad')"), 'Report API dispatcher route missing');
assert(/c3JjL3BhZ2VzL0FkRGV0YWlsUGFnZS50c3hAMTExOjEy[\s\S]{0,160}display:\s*block\s*!important/.test(mobileCss), 'Mobile Report this ad block is hidden');
assert(/create table if not exists public\.ad_reports/i.test(reportSql), 'Report storage migration missing');

function mockRequest(method, body, ip) {
  const req = new EventEmitter();
  req.method = method;
  req.headers = { 'x-forwarded-for': ip || `127.0.0.${Math.floor(Math.random() * 200) + 1}` };
  req.socket = { remoteAddress: req.headers['x-forwarded-for'] };
  process.nextTick(() => {
    if (body !== undefined) req.emit('data', Buffer.from(JSON.stringify(body)));
    req.emit('end');
  });
  return req;
}

function mockResponse() {
  let done;
  const finished = new Promise((resolve) => { done = resolve; });
  const res = {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    end(value) { this.body = String(value || ''); done(this); }
  };
  res.finished = finished;
  return res;
}

(async () => {
  const handler = require('./api-handlers/report-ad');

  let req = mockRequest('GET', undefined, 'test-get');
  let res = mockResponse();
  await handler(req, res);
  await res.finished;
  assert.strictEqual(res.statusCode, 405, 'Report API must reject non-POST');

  req = mockRequest('POST', { adId: 'abc', reason: 'invalid' }, 'test-invalid');
  res = mockResponse();
  await handler(req, res);
  await res.finished;
  assert.strictEqual(res.statusCode, 400, 'Report API must reject invalid reasons');

  const oldUrl = process.env.SUPABASE_URL;
  const oldService = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const oldFetch = global.fetch;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  global.fetch = async (url, options) => {
    assert.strictEqual(url, 'https://example.supabase.co/rest/v1/ad_reports');
    assert.strictEqual(options.method, 'POST');
    const payload = JSON.parse(options.body);
    assert.strictEqual(payload.reason, 'spam');
    assert(payload.message.includes('[Listing ID: listing-123]'));
    return { ok: true, status: 201, text: async () => JSON.stringify([{ id: 'report-1' }]) };
  };

  req = mockRequest('POST', {
    adId: 'listing-123',
    reason: 'spam',
    message: 'Repeated listing',
    reporterEmail: 'tester@example.com',
    pageUrl: 'https://ehemehe.lk/ad/listing-123'
  }, 'test-success');
  res = mockResponse();
  await handler(req, res);
  await res.finished;
  assert.strictEqual(res.statusCode, 200, 'Valid report should be accepted');
  assert.strictEqual(JSON.parse(res.body).ok, true);

  global.fetch = oldFetch;
  if (oldUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = oldUrl;
  if (oldService === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = oldService;

  console.log('Public home/search/favourites/report regression tests passed.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
