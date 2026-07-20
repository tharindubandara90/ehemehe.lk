'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  AD_LIFETIME_DAYS,
  AD_LIFETIME_MS,
  expiresAtIso,
  isExpiredAd,
  isDemoAd,
  filterLiveAds
} = require('./lib/ad-lifecycle');

const root = __dirname;
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

assert.strictEqual(AD_LIFETIME_DAYS, 25, 'Ads must expire after exactly 25 days.');
assert.strictEqual(AD_LIFETIME_MS, 25 * 24 * 60 * 60 * 1000, '25-day duration is incorrect.');

const now = Date.parse('2026-07-20T00:00:00.000Z');
const fresh = { id: 'fresh', title: 'Real listing', created_at: '2026-06-26T00:00:01.000Z' };
const expired = { id: 'expired', title: 'Old real listing', created_at: '2026-06-25T00:00:00.000Z' };
const demo = { id: 'demo', title: '2020 Toyota Prius Hybrid - Low Mileage', created_at: '2026-07-19T00:00:00.000Z' };
assert.strictEqual(isExpiredAd(fresh, now), false, 'A listing under 25 days must stay live.');
assert.strictEqual(isExpiredAd(expired, now), true, 'A listing at 25 days must expire.');
assert.strictEqual(isDemoAd(demo), true, 'Bundled demo listing must be detected.');
assert.deepStrictEqual(filterLiveAds([fresh, expired, demo], now).map((row) => row.id), ['fresh']);
assert.strictEqual(expiresAtIso(now), '2026-08-14T00:00:00.000Z');

const accountUi = read('public/account-management.js');
assert(accountUi.includes("cleanPath() === '/dashboard/settings'"), 'Delete Account UI must target Settings.');
assert(accountUi.includes("fetch('/api/delete-account'"), 'Delete Account UI must use the server endpoint.');
assert(accountUi.includes("method: 'DELETE'"), 'Delete Account request must use DELETE.');
assert(accountUi.includes("confirmation: 'DELETE'"), 'Permanent deletion confirmation is missing.');
assert(accountUi.includes('MutationObserver'), 'SPA route rendering support is missing.');

const css = read('public/report-fixes.css');
assert(css.includes('.ehm-delete-account-v2'), 'Desktop Delete Account styles are missing.');
assert(css.includes('@media(max-width:640px)'), 'Mobile Delete Account styles are missing.');
assert(css.includes('.ehm-account-modal'), 'Delete confirmation modal styles are missing.');

const html = read('public/index.html');
assert(/account-management\.js\?v=/.test(html), 'Versioned account management script is not loaded.');

const dispatcher = read('lib/api-dispatcher.js');
assert(dispatcher.includes("'/api/delete-account'"), 'Delete Account API route is missing.');
assert(dispatcher.includes("'/api/cleanup-expired-ads'"), 'Expired-ad cleanup API route is missing.');

const deleteAccount = read('api-handlers/delete-account.js');
assert(deleteAccount.includes('deleteAdRecord'), 'Account deletion must remove owned ads and dependencies.');
assert(deleteAccount.includes('OWNERSHIP_FILTERS'), 'Account deletion must support all ownership schemas.');
assert(deleteAccount.includes('/auth/v1/admin/users/'), 'Auth account deletion is missing.');

const publish = read('api-handlers/publish-ad.js');
assert(publish.includes('expiresAtIso'), 'New ads must receive a 25-day expiry.');
assert(publish.includes('expires_at'), 'New ad expiry field is missing.');

const myAds = read('api-handlers/my-ads.js');
const publicUtils = read('lib/public-ads-utils.js');
assert(myAds.includes('expiryCutoffIso'), 'My Ads must exclude listings older than 25 days.');
assert(myAds.includes('filterLiveAds'), 'My Ads must exclude demo and expired listings.');
assert(publicUtils.includes('expiryCutoffIso'), 'Public ads must query only the 25-day live window.');
assert(publicUtils.includes('filterLiveAds'), 'Public ads must filter demo and expired listings.');

const vercel = JSON.parse(read('vercel.json'));
assert(vercel.crons?.some((cron) => cron.path === '/api/cleanup-expired-ads' && cron.schedule), 'Daily expired-ad cron is missing.');

assert.deepStrictEqual(JSON.parse(read('public/static-ads.json')), [], 'Static demo JSON must be empty.');
for (const file of ['public/index-filters.js', 'public/admin.js', 'public/admin/admin.js', 'public/marketplace.js']) {
  const source = read(file);
  assert(!source.includes('"title":"2020 Toyota Prius Hybrid - Low Mileage"'), `${file} still embeds demo products.`);
}
const bundle = read('public/js/index-BsKly-Vj.js');
assert(bundle.includes('const Ce=[],Ht=[];'), 'React template demo arrays must stay empty.');
assert(!bundle.includes('2020 Toyota Prius Hybrid - Low Mileage'), 'React bundle still includes demo products.');

for (const schema of ['supabase_marketplace_core_schema.sql', 'supabase_post_ad_end_to_end.sql']) {
  const sql = read(schema);
  assert(sql.includes("interval '25 days'"), `${schema} is missing 25-day expiry.`);
  assert(sql.includes('ads_expires_at_idx'), `${schema} is missing the expiry index.`);
  assert(sql.includes('Remove bundled/template demo listings immediately'), `${schema} is missing immediate demo cleanup.`);
}


const focusedMigration = read('supabase_25_day_ad_expiry_demo_cleanup.sql');
assert(focusedMigration.includes("interval '25 days'"), 'Focused Supabase migration is missing 25-day expiry.');
assert(focusedMigration.includes('delete from public.ads'), 'Focused Supabase migration is missing demo deletion.');

console.log('Account delete, 25-day expiry, and demo cleanup regression test passed.');
