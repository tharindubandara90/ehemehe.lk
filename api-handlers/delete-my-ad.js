'use strict';
const { json, supabasePublicKey, supabaseAdminConfig } = require('../lib/otp-utils');

function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 20000) reject(new Error('Request is too large.')); });
    req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch (_) { reject(new Error('Invalid request body.')); } });
    req.on('error', reject);
  });
}
function parseJson(value) { if (value && typeof value === 'object') return value; try { return JSON.parse(value || '{}'); } catch (_) { return {}; } }
async function userFor(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) throw new Error('AUTH_REQUIRED');
  const { url } = supabaseAdminConfig();
  const publicKey = supabasePublicKey();
  const response = await fetch(`${url}/auth/v1/user`, { headers: { apikey: publicKey, Authorization: `Bearer ${token}` } });
  const user = await response.json().catch(() => ({}));
  if (!response.ok || !user.id) throw new Error('AUTH_REQUIRED');
  return user;
}
function owns(row, id) {
  const custom = parseJson(row?.custom_fields);
  return [row?.user_id,row?.owner_id,row?.seller_id,row?.profile_id,row?.created_by,custom.owner_user_id].some((v) => String(v || '') === String(id));
}
module.exports = async function handler(req, res) {
  if (!['POST','DELETE'].includes(req.method)) return json(res, 405, { ok:false, message:'Method not allowed' });
  try {
    const user = await userFor(req);
    const body = await readBody(req);
    const id = String(body.id || '').trim();
    if (!id || id.length > 100 || !/^[a-zA-Z0-9._:-]+$/.test(id)) throw new Error('Invalid ad ID.');
    const { url, key } = supabaseAdminConfig();
    const headers = { apikey:key, Authorization:`Bearer ${key}`, Accept:'application/json' };
    const read = await fetch(`${url}/rest/v1/ads?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers });
    const rows = await read.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!read.ok) throw new Error(rows.message || 'Could not load the ad.');
    if (!row) return json(res, 404, { ok:false, message:'Ad not found.' });
    if (!owns(row, user.id)) return json(res, 403, { ok:false, message:'You can delete only your own ads.' });
    const del = await fetch(`${url}/rest/v1/ads?id=eq.${encodeURIComponent(id)}`, { method:'DELETE', headers:{...headers, Prefer:'return=minimal'} });
    if (!del.ok) { const e = await del.json().catch(() => ({})); throw new Error(e.message || 'Could not delete the ad.'); }
    return json(res, 200, { ok:true, message:'Ad deleted.' });
  } catch (error) {
    const auth = error.message === 'AUTH_REQUIRED';
    return json(res, auth ? 401 : 400, { ok:false, message:auth ? 'Log in to delete your ad.' : (error.message || 'Could not delete the ad.') });
  }
};
