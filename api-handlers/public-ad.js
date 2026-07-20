'use strict';

const { json, supabasePublicKey } = require('../lib/otp-utils');
const {
  queryAds, normalizeAd, parseJson, queryAdImageCount,
  isPublicAdStatus, config, rest
} = require('../lib/public-ads-utils');

const SUPERADMIN_EMAILS = new Set(['ehemehe.lk@gmail.com']);

function bearerToken(req) {
  return String(req.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
}

function userEmails(user) {
  const metadata = user?.user_metadata || {};
  return [user?.email, metadata.contact_email, metadata.email]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);
}

async function optionalUser(req) {
  const token = bearerToken(req);
  if (!token) return null;
  const { url } = config();
  try {
    const response = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: supabasePublicKey(), Authorization: `Bearer ${token}` }
    });
    const data = await response.json().catch(() => null);
    return response.ok && data?.id ? data : null;
  } catch (_) {
    return null;
  }
}

function ownsAd(user, row) {
  if (!user?.id || !row) return false;
  const custom = parseJson(row.custom_fields, {});
  const ownerIds = [row.user_id, row.owner_user_id, row.owner_id, row.seller_id, row.profile_id, row.created_by, custom.owner_user_id]
    .filter(Boolean).map(String);
  return ownerIds.includes(String(user.id));
}

async function isStaff(user) {
  if (!user?.id) return false;
  const metadata = user.user_metadata || {};
  if (userEmails(user).some((email) => SUPERADMIN_EMAILS.has(email))) return true;
  if (['superadmin','admin','moderator'].includes(String(metadata.role || metadata.user_role || '').trim().toLowerCase())) return true;
  const filters = [`user_id=eq.${encodeURIComponent(user.id)}`];
  userEmails(user).forEach((email) => filters.push(`email=eq.${encodeURIComponent(email)}`));
  for (const filter of filters) {
    try {
      const rows = await rest(`/rest/v1/staff_permissions?select=can_view_ads,can_approve_ads,can_edit_ads&${filter}&limit=1`, {}, 3500);
      const row = Array.isArray(rows) ? rows[0] : null;
      if (row && (row.can_view_ads || row.can_approve_ads || row.can_edit_ads)) return true;
    } catch (error) {
      if (!/relation|table|column|schema cache|PGRST205|42P01/i.test(error.message || '')) break;
    }
  }
  return false;
}

function noStore(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, message: 'Method not allowed' });
  try {
    const url = new URL(req.url, 'http://localhost');
    const id = String(url.searchParams.get('id') || '').trim();
    if (!id || id.length > 100 || !/^[a-zA-Z0-9._:-]+$/.test(id)) {
      return json(res, 400, { ok: false, message: 'Invalid ad ID.' });
    }

    // Fetch the exact record first. Public visibility is checked after the row
    // is found so the signed-in owner can preview a pending listing, while
    // anonymous visitors still only receive approved/live ads.
    const rows = await queryAds({ id, approvedOnly: false });
    const row = rows[0];
    if (!row) {
      noStore(res);
      return json(res, 404, { ok: false, message: 'Ad not found.' });
    }

    let visibility = 'public';
    if (!isPublicAdStatus(row)) {
      const user = await optionalUser(req);
      const allowed = ownsAd(user, row) || await isStaff(user);
      if (!allowed) {
        noStore(res);
        return json(res, 404, { ok: false, message: 'Ad not found.' });
      }
      visibility = 'owner-preview';
    }

    const custom = parseJson(row.custom_fields, {});
    let imageCount = Number(custom.image_count || custom.images_count || 0);
    if (!Number.isFinite(imageCount) || imageCount < 1) {
      try { imageCount = await queryAdImageCount(id); }
      catch (_) { imageCount = row.image_url ? 1 : 0; }
    }
    row._image_count = Math.max(0, Math.min(10, Math.round(imageCount || 0)));
    noStore(res);
    return json(res, 200, {
      ok: true,
      generatedAt: new Date().toISOString(),
      visibility,
      ad: normalizeAd(row, true)
    });
  } catch (error) {
    noStore(res);
    return json(res, 502, { ok: false, message: error.message || 'Could not load the ad.' });
  }
};
