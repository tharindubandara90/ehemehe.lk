'use strict';
const { json, supabasePublicKey, supabaseAdminConfig } = require('../lib/otp-utils');

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

async function authenticatedUser(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) throw new Error('AUTH_REQUIRED');
  const { url } = supabaseAdminConfig();
  const publicKey = supabasePublicKey();
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: publicKey, Authorization: `Bearer ${token}` }
  });
  const user = await response.json().catch(() => ({}));
  if (!response.ok || !user.id) throw new Error('AUTH_REQUIRED');
  return user;
}

function ownsAd(row, userId) {
  const custom = parseJson(row?.custom_fields);
  return [row?.user_id, row?.owner_id, row?.seller_id, row?.profile_id, row?.created_by, custom.owner_user_id]
    .some((value) => String(value || '') === String(userId));
}

async function deleteOwnedAds(url, key, userId) {
  const headers = { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' };
  let rows = [];
  try {
    const response = await fetch(`${url}/rest/v1/ads?select=id,user_id,owner_id,seller_id,profile_id,created_by,custom_fields&limit=5000`, { headers });
    const payload = await response.json().catch(() => []);
    if (response.ok && Array.isArray(payload)) rows = payload;
  } catch (_) {}

  const ids = rows.filter((row) => ownsAd(row, userId)).map((row) => String(row.id || '')).filter(Boolean);
  for (const id of ids) {
    const encoded = encodeURIComponent(id);
    try {
      await fetch(`${url}/rest/v1/ad_promotions?ad_id=eq.${encoded}`, { method: 'DELETE', headers });
    } catch (_) {}
    try {
      await fetch(`${url}/rest/v1/ad_reports?ad_id=eq.${encoded}`, { method: 'DELETE', headers });
    } catch (_) {}
    const response = await fetch(`${url}/rest/v1/ads?id=eq.${encoded}`, { method: 'DELETE', headers: { ...headers, Prefer: 'return=minimal' } });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message || 'Could not remove account listings.');
    }
  }
  return ids.length;
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
    const removedAds = await deleteOwnedAds(url, key, user.id);
    const encodedUserId = encodeURIComponent(user.id);
    const response = await fetch(`${url}/auth/v1/admin/users/${encodedUserId}`, {
      method: 'DELETE',
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || payload.error_description || 'Could not delete the account.');
    return json(res, 200, { ok: true, message: 'Account permanently deleted.', removedAds });
  } catch (error) {
    const auth = error.message === 'AUTH_REQUIRED';
    return json(res, auth ? 401 : 400, {
      ok: false,
      message: auth ? 'Log in to delete your account.' : (error.message || 'Could not delete the account.')
    });
  }
};
