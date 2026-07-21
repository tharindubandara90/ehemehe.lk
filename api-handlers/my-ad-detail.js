const { json, supabasePublicKey, supabaseAdminConfig } = require('../lib/otp-utils');

function parseJson(value, fallback) {
  if (value && typeof value === 'object') return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch (_) {}
  }
  return fallback;
}

async function authenticatedUser(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) throw new Error('AUTH_REQUIRED');
  const { url } = supabaseAdminConfig();
  const publicKey = supabasePublicKey();
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: publicKey, Authorization: `Bearer ${token}` }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.id) throw new Error('AUTH_REQUIRED');
  return data;
}

function ownsAd(ad, userId) {
  const custom = parseJson(ad?.custom_fields, {});
  return [ad?.user_id, ad?.owner_id, ad?.seller_id, ad?.profile_id, ad?.created_by, custom.owner_user_id]
    .some((value) => String(value || '') === String(userId));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, message: 'Method not allowed' });
  try {
    const user = await authenticatedUser(req);
    const requestUrl = new URL(req.url || '/', 'http://localhost');
    const id = String(req.query?.id || requestUrl.searchParams.get('id') || '').trim();
    if (!id || id.length > 100 || !/^[a-zA-Z0-9._:-]+$/.test(id)) throw new Error('Invalid ad ID.');
    const { url, key } = supabaseAdminConfig();
    const params = new URLSearchParams({ select: '*', id: `eq.${id}`, limit: '1' });
    const response = await fetch(`${url}/rest/v1/ads?${params.toString()}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }
    });
    const data = await response.json().catch(() => []);
    if (!response.ok) throw new Error(data.message || data.details || 'Could not load the ad.');
    const ad = Array.isArray(data) ? data[0] : null;
    if (!ad) return json(res, 404, { ok: false, message: 'Ad not found.' });
    if (!ownsAd(ad, user.id)) return json(res, 403, { ok: false, message: 'You can edit only your own ads.' });
    let images = parseJson(ad.images, []);
    if (!Array.isArray(images)) images = [];
    if (!images.length && ad.image_url) images = [ad.image_url];
    return json(res, 200, { ok: true, ad: { ...ad, images: images.slice(0, 10), image_url: images[0] || ad.image_url || '' } });
  } catch (error) {
    const auth = error.message === 'AUTH_REQUIRED';
    return json(res, auth ? 401 : 400, { ok: false, message: auth ? 'Log in to edit your ad.' : (error.message || 'Could not load the ad.') });
  }
};
