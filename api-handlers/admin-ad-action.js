'use strict';

const { json, supabaseAdminConfig, supabasePublicKey } = require('../lib/otp-utils');
const { parseJson } = require('../lib/public-ads-utils');

const SUPERADMIN_EMAILS = new Set(['ehemehe.lk@gmail.com']);
const EDITABLE_FIELDS = new Set([
  'title','description','price','currency','phone','condition','status','reject_reason',
  'category_id','city_id','image_url','images','custom_fields','expires_at','updated_at',
  'is_featured','is_promoted','featured','promoted','promotion_type','view_count','views',
  'finance_enabled','finance_downpayment','finance_monthly_payment','finance_downpayment_percent',
  'finance_annual_rate_percent','finance_months','finance_company_phone'
]);

function cleanEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function authToken(req) {
  return String(req.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
}

async function currentUser(req) {
  const token = authToken(req);
  if (!token) throw Object.assign(new Error('AUTH_REQUIRED'), { statusCode: 401 });
  const { url } = supabaseAdminConfig();
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: supabasePublicKey(), Authorization: `Bearer ${token}` }
  });
  const user = await response.json().catch(() => ({}));
  if (!response.ok || !user?.id) throw Object.assign(new Error('AUTH_REQUIRED'), { statusCode: 401 });
  return user;
}

async function restJson(pathname, options = {}) {
  const { url, key } = supabaseAdminConfig();
  const response = await fetch(`${url}${pathname}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
      ...(options.headers || {})
    }
  });
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; }
  catch (_) { data = raw; }
  if (!response.ok) {
    const message = data?.message || data?.details || data?.hint || String(data || `HTTP ${response.status}`);
    throw Object.assign(new Error(message), { statusCode: response.status, payload: data });
  }
  return data;
}

async function staffPermissions(user) {
  const metadata = user?.user_metadata || {};
  const emails = [user?.email, metadata.contact_email, metadata.email].map(cleanEmail).filter(Boolean);
  if (emails.some((email) => SUPERADMIN_EMAILS.has(email))) {
    return { superadmin: true, can_view_ads: true, can_approve_ads: true, can_edit_ads: true, can_delete_ads: true };
  }
  const role = String(metadata.role || metadata.user_role || '').trim().toLowerCase();
  if (role === 'superadmin' || role === 'admin') {
    return { superadmin: role === 'superadmin', can_view_ads: true, can_approve_ads: true, can_edit_ads: true, can_delete_ads: true };
  }

  const filters = [`user_id=eq.${encodeURIComponent(user.id)}`];
  emails.forEach((email) => filters.push(`email=eq.${encodeURIComponent(email)}`));
  for (const filter of filters) {
    try {
      const rows = await restJson(`/rest/v1/staff_permissions?select=*&${filter}&limit=1`);
      if (Array.isArray(rows) && rows[0]) return rows[0];
    } catch (error) {
      if (!/relation|table|column|schema cache|PGRST205|42P01/i.test(error.message || '')) throw error;
    }
  }
  return {};
}

function permissionFor(action, changes) {
  if (action === 'delete') return 'can_delete_ads';
  const keys = Object.keys(changes || {});
  const approvalOnly = keys.length > 0 && keys.every((key) => ['status','reject_reason','updated_at'].includes(key));
  return approvalOnly ? 'can_approve_ads' : 'can_edit_ads';
}

function sanitizeChanges(input) {
  const source = input && typeof input === 'object' ? input : {};
  const out = {};
  Object.entries(source).forEach(([key, value]) => {
    if (EDITABLE_FIELDS.has(key)) out[key] = value;
  });
  return out;
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  return await new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; if (body.length > 2_000_000) reject(new Error('Request too large.')); });
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch (error) { reject(error); } });
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, message: 'Method not allowed' });
  try {
    const user = await currentUser(req);
    const permissions = await staffPermissions(user);
    const body = await readBody(req);
    const action = String(body.action || 'update').trim().toLowerCase();
    const id = String(body.id || '').trim();
    if (!id || id.length > 100 || !/^[a-zA-Z0-9._:-]+$/.test(id)) {
      return json(res, 400, { ok: false, message: 'Invalid ad ID.' });
    }

    const changes = sanitizeChanges(body.changes);
    const required = permissionFor(action, changes);
    if (!permissions?.[required] && !permissions?.superadmin) {
      return json(res, 403, { ok: false, message: 'You do not have permission to manage this ad.' });
    }

    if (action === 'delete') {
      await Promise.allSettled([
        restJson(`/rest/v1/ad_promotions?ad_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }),
        restJson(`/rest/v1/ad_reports?ad_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } })
      ]);
      await restJson(`/rest/v1/ads?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', headers: { Prefer: 'return=representation' } });
      return json(res, 200, { ok: true, id, deleted: true });
    }

    if (!Object.keys(changes).length) return json(res, 400, { ok: false, message: 'No ad changes were provided.' });
    if (!Object.prototype.hasOwnProperty.call(changes, 'updated_at')) changes.updated_at = new Date().toISOString();
    if (changes.custom_fields !== undefined) changes.custom_fields = parseJson(changes.custom_fields, changes.custom_fields || {});

    const rows = await restJson(`/rest/v1/ads?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(changes)
    });
    const ad = Array.isArray(rows) ? rows[0] : rows;
    if (!ad) return json(res, 404, { ok: false, message: 'Ad not found.' });
    return json(res, 200, { ok: true, ad });
  } catch (error) {
    const status = Number(error.statusCode) || (error.message === 'AUTH_REQUIRED' ? 401 : 500);
    return json(res, status, { ok: false, message: status === 401 ? 'Admin login required.' : (error.message || 'Could not update the ad.') });
  }
};
