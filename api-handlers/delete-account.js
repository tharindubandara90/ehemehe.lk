'use strict';

const { json, supabasePublicKey, supabaseAdminConfig } = require('../lib/otp-utils');
const { deleteAdRecord, missingRelationOrColumn } = require('../lib/ad-lifecycle');

const REQUEST_TIMEOUT_MS = 8000;
const OWNERSHIP_FILTERS = Object.freeze([
  ['user_id', 'user_id'],
  ['owner_id', 'owner_id'],
  ['seller_id', 'seller_id'],
  ['profile_id', 'profile_id'],
  ['created_by', 'created_by'],
  ['custom_fields->>owner_user_id', 'custom_fields']
]);

function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let body = '';
    let settled = false;
    req.on('data', (chunk) => {
      if (settled) return;
      body += chunk;
      if (body.length > 20000) {
        settled = true;
        reject(new Error('Request is too large.'));
      }
    });
    req.on('end', () => {
      if (settled) return;
      try { resolve(JSON.parse(body || '{}')); }
      catch (_) { reject(new Error('Invalid request body.')); }
    });
    req.on('error', reject);
  });
}

function parseJson(value) {
  if (value && typeof value === 'object') return value;
  try { return JSON.parse(value || '{}'); } catch (_) { return {}; }
}

function headersFor(key, extra = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: 'application/json',
    ...extra
  };
}

async function fetchJson(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch (_) { data = text; }
    }
    return { response, data };
  } finally {
    clearTimeout(timer);
  }
}

async function authenticatedUser(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) throw new Error('AUTH_REQUIRED');
  const { url } = supabaseAdminConfig();
  const publicKey = supabasePublicKey();
  const { response, data } = await fetchJson(`${url}/auth/v1/user`, {
    headers: { apikey: publicKey, Authorization: `Bearer ${token}` }
  }, 5000);
  if (!response.ok || !data?.id) throw new Error('AUTH_REQUIRED');
  return data;
}

function payloadMessage(data, fallback) {
  if (data && typeof data === 'object') return data.message || data.details || data.error_description || fallback;
  return String(data || fallback);
}

function ownsAd(row, userId) {
  const custom = parseJson(row?.custom_fields);
  return [row?.user_id, row?.owner_id, row?.seller_id, row?.profile_id, row?.created_by, custom.owner_user_id]
    .some((value) => String(value || '') === String(userId));
}

async function queryOwnedIds(url, key, filterName, selectedColumn, userId) {
  const params = new URLSearchParams({ select: `id,${selectedColumn}`, limit: '10000' });
  params.set(filterName, `eq.${userId}`);
  const { response, data } = await fetchJson(`${url}/rest/v1/ads?${params.toString()}`, {
    headers: headersFor(key)
  });
  if (response.ok) {
    return {
      ok: true,
      ids: (Array.isArray(data) ? data : [])
        .filter((row) => ownsAd(row, userId))
        .map((row) => String(row?.id || ''))
        .filter(Boolean)
    };
  }
  if (missingRelationOrColumn(data)) return { ok: false, schemaMissing: true, ids: [] };
  throw new Error(payloadMessage(data, 'Could not find account listings.'));
}

async function compatibilityOwnedIds(url, key, userId) {
  const selectVariants = [
    'id,user_id,owner_id,seller_id,profile_id,created_by,custom_fields',
    'id,user_id,custom_fields',
    'id,custom_fields'
  ];

  for (const select of selectVariants) {
    const params = new URLSearchParams({ select, limit: '10000' });
    const { response, data } = await fetchJson(`${url}/rest/v1/ads?${params.toString()}`, {
      headers: headersFor(key)
    });
    if (response.ok) {
      return (Array.isArray(data) ? data : [])
        .filter((row) => ownsAd(row, userId))
        .map((row) => String(row?.id || ''))
        .filter(Boolean);
    }
    if (!missingRelationOrColumn(data)) {
      throw new Error(payloadMessage(data, 'Could not inspect account listings.'));
    }
  }
  // A missing ads table means the account has no listings to remove.
  return [];
}

async function deleteOwnedAds(url, key, userId) {
  const results = await Promise.all(
    OWNERSHIP_FILTERS.map(([filterName, selectedColumn]) => queryOwnedIds(url, key, filterName, selectedColumn, userId))
  );
  const ids = new Set();
  results.forEach((result) => result.ids.forEach((id) => ids.add(id)));

  // Old deployments can have no filterable ownership column. In that case a
  // single compatibility scan is performed and every row is checked in-process.
  if (!results.some((result) => result.ok)) {
    const compatibilityIds = await compatibilityOwnedIds(url, key, userId);
    compatibilityIds.forEach((id) => ids.add(id));
  }

  for (const id of ids) await deleteAdRecord(url, key, id);
  return ids.size;
}

async function deleteOptionalRows(url, key, table, filterName, value) {
  const endpoint = `${url}/rest/v1/${table}?${encodeURIComponent(filterName)}=eq.${encodeURIComponent(String(value))}`;
  const { response, data } = await fetchJson(endpoint, {
    method: 'DELETE',
    headers: headersFor(key, { Prefer: 'return=minimal' })
  });
  if (response.ok || response.status === 404 || missingRelationOrColumn(data)) return null;
  return payloadMessage(data, `Could not clean ${table}.`);
}

async function cleanupUserRows(url, key, user) {
  const userId = user.id;
  const email = String(user.email || '').trim();
  const tasks = [
    ['profiles', 'id', userId],
    ['profiles', 'user_id', userId],
    ['shops', 'user_id', userId],
    ['verifications', 'user_id', userId],
    ['payments', 'user_id', userId],
    ['invoices', 'user_id', userId],
    ['sms_otp_logs', 'user_id', userId],
    ['favorites', 'user_id', userId],
    ['messages', 'sender_id', userId],
    ['messages', 'receiver_id', userId]
  ];
  if (email) {
    tasks.push(['ad_reports', 'reporter_email', email]);
    tasks.push(['sms_otp_logs', 'email', email]);
  }

  const results = await Promise.all(tasks.map(([table, field, value]) =>
    deleteOptionalRows(url, key, table, field, value).catch((error) => error?.message || String(error))
  ));
  return results.filter(Boolean);
}

module.exports = async function handler(req, res) {
  if (!['POST', 'DELETE'].includes(req.method)) return json(res, 405, { ok: false, message: 'Method not allowed' });

  try {
    const user = await authenticatedUser(req);
    const body = await readBody(req);
    if (String(body.confirmation || '').trim().toUpperCase() !== 'DELETE') {
      throw new Error('Type DELETE to confirm permanent account deletion.');
    }

    const { url, key } = supabaseAdminConfig();
    // Listings are strict: the auth account is not removed if one of its ads
    // cannot be found or deleted, preventing inaccessible orphan listings.
    const removedAds = await deleteOwnedAds(url, key, user.id);
    const cleanupWarnings = await cleanupUserRows(url, key, user);

    const { response, data } = await fetchJson(`${url}/auth/v1/admin/users/${encodeURIComponent(user.id)}`, {
      method: 'DELETE',
      headers: headersFor(key)
    });
    if (!response.ok) throw new Error(payloadMessage(data, 'Could not delete the account.'));

    res.setHeader?.('Cache-Control', 'no-store');
    return json(res, 200, {
      ok: true,
      message: 'Account permanently deleted.',
      removedAds,
      cleanupWarnings: cleanupWarnings.length
    });
  } catch (error) {
    const auth = error.message === 'AUTH_REQUIRED';
    const timeout = error?.name === 'AbortError';
    return json(res, auth ? 401 : (timeout ? 504 : 400), {
      ok: false,
      message: auth
        ? 'Log in to delete your account.'
        : timeout
          ? 'Account deletion took too long. Please retry.'
          : (error.message || 'Could not delete the account.')
    });
  }
};
