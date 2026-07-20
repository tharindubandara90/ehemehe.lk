'use strict';

const AD_LIFETIME_DAYS = 25;
const AD_LIFETIME_MS = AD_LIFETIME_DAYS * 24 * 60 * 60 * 1000;

// These were bundled preview listings from the original template. They are not
// real user listings and must never be returned by public or account APIs.
const DEMO_TITLES = Object.freeze([
  '2020 Toyota Prius Hybrid - Low Mileage',
  'Modern 3-Bedroom House in Kandy',
  'iPhone 15 Pro Max 256GB - Space Black',
  'Samsung 65" QLED 4K Smart TV',
  'Professional Guitar - Fender Stratocaster',
  'Honda CB150R - Excellent Condition',
  'MacBook Pro M3 14-inch 16GB/512GB',
  'Golden Retriever Puppies - 3 Months',
  'Modern Sofa Set - 7 Piece',
  'Software Engineer - Remote Position',
  'Land for Sale - 10 Perches in Kadawatha',
  'Professional Photography Services',
  'Nike Air Max 270 - White/Black',
  'Three Wheeler - Bajaj RE 205',
  'A-Level Physics Tuition - Online',
  'Industrial Sewing Machine - Juki',
  'Used Laptop - Core i5, 8GB RAM'
]);

const DEMO_TITLE_SET = new Set(DEMO_TITLES.map((title) => title.trim().toLowerCase()));

function parseJson(value, fallback = {}) {
  if (value && typeof value === 'object') return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch (_) {}
  }
  return fallback;
}

function expiryCutoffIso(now = Date.now()) {
  const time = now instanceof Date ? now.getTime() : Number(now);
  return new Date((Number.isFinite(time) ? time : Date.now()) - AD_LIFETIME_MS).toISOString();
}

function expiresAtIso(now = Date.now()) {
  const time = now instanceof Date ? now.getTime() : Number(now);
  return new Date((Number.isFinite(time) ? time : Date.now()) + AD_LIFETIME_MS).toISOString();
}

function isDemoAd(row) {
  const custom = parseJson(row?.custom_fields || row?.customFields, {});
  const title = String(row?.title || '').trim().toLowerCase();
  return DEMO_TITLE_SET.has(title) || custom.is_demo === true || custom.demo === true || custom.sample === true;
}

function isExpiredAd(row, now = Date.now()) {
  const custom = parseJson(row?.custom_fields || row?.customFields, {});
  const explicit = row?.expires_at || row?.expiresAt || custom.expires_at;
  const created = row?.created_at || row?.createdAt || row?.postedAt || custom.submitted_at;
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  const safeNow = Number.isFinite(nowMs) ? nowMs : Date.now();

  if (explicit) {
    const expiresMs = new Date(explicit).getTime();
    if (Number.isFinite(expiresMs)) return expiresMs <= safeNow;
  }

  if (!created) return false;
  const createdMs = new Date(created).getTime();
  return Number.isFinite(createdMs) && createdMs + AD_LIFETIME_MS <= safeNow;
}

function filterLiveAds(rows, now = Date.now()) {
  return (Array.isArray(rows) ? rows : []).filter((row) => !isDemoAd(row) && !isExpiredAd(row, now));
}

function headersFor(key, extra = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: 'application/json',
    ...extra
  };
}

async function responseJson(response) {
  const raw = await response.text();
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (_) { return raw; }
}

function missingRelationOrColumn(payload) {
  const text = [payload?.message, payload?.details, payload?.hint, payload].filter(Boolean).join(' ');
  return ['42P01', '42703', 'PGRST204', 'PGRST205'].includes(payload?.code) ||
    /relation .* does not exist|could not find the table|could not find .* column|column .* does not exist|schema cache/i.test(text);
}

async function deleteIfPresent(url, key, table, filterName, filterValue) {
  const endpoint = `${url}/rest/v1/${table}?${encodeURIComponent(filterName)}=eq.${encodeURIComponent(String(filterValue))}`;
  const response = await fetch(endpoint, {
    method: 'DELETE',
    headers: headersFor(key, { Prefer: 'return=minimal' })
  });
  if (response.ok || response.status === 404) return;
  const payload = await responseJson(response);
  if (missingRelationOrColumn(payload)) return;
  throw new Error(payload?.message || payload?.details || `Could not clean ${table}.`);
}

async function deleteAdRecord(url, key, id) {
  // These tables have existed in different schema versions. Missing optional
  // tables are ignored, but failure to delete the ad itself is not ignored.
  await Promise.all([
    deleteIfPresent(url, key, 'ad_promotions', 'ad_id', id),
    deleteIfPresent(url, key, 'ad_reports', 'ad_id', id)
  ]);

  const response = await fetch(`${url}/rest/v1/ads?id=eq.${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
    headers: headersFor(key, { Prefer: 'return=minimal' })
  });
  if (response.ok || response.status === 404) return;
  const payload = await responseJson(response);
  throw new Error(payload?.message || payload?.details || 'Could not delete an expired ad.');
}

async function cleanupExpiredAndDemoAds(url, key, now = Date.now()) {
  const params = new URLSearchParams({
    select: 'id,title,created_at,expires_at,custom_fields',
    order: 'created_at.asc',
    limit: '10000'
  });

  let response = await fetch(`${url}/rest/v1/ads?${params.toString()}`, {
    headers: headersFor(key)
  });
  let payload = await responseJson(response);

  // Compatibility with projects that have not run the new expires_at migration.
  if (!response.ok && missingRelationOrColumn(payload)) {
    params.set('select', 'id,title,created_at,custom_fields');
    response = await fetch(`${url}/rest/v1/ads?${params.toString()}`, {
      headers: headersFor(key)
    });
    payload = await responseJson(response);
  }

  if (!response.ok) {
    if (missingRelationOrColumn(payload)) return { scanned: 0, deleted: 0, expired: 0, demo: 0, skipped: true };
    throw new Error(payload?.message || payload?.details || 'Could not scan ads for expiry.');
  }

  const rows = Array.isArray(payload) ? payload : [];
  const candidates = rows.filter((row) => isExpiredAd(row, now) || isDemoAd(row));
  let deleted = 0;
  let expired = 0;
  let demo = 0;

  for (const row of candidates) {
    if (isExpiredAd(row, now)) expired += 1;
    if (isDemoAd(row)) demo += 1;
    await deleteAdRecord(url, key, row.id);
    deleted += 1;
  }

  return { scanned: rows.length, deleted, expired, demo, skipped: false };
}

module.exports = {
  AD_LIFETIME_DAYS,
  AD_LIFETIME_MS,
  DEMO_TITLES,
  expiryCutoffIso,
  expiresAtIso,
  isDemoAd,
  isExpiredAd,
  filterLiveAds,
  cleanupExpiredAndDemoAds,
  deleteAdRecord,
  missingRelationOrColumn
};
