const {
  json, supabasePublicKey, supabaseAdminConfig
} = require('./_otp-utils');

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

function customFields(row) {
  if (row?.custom_fields && typeof row.custom_fields === 'object') return row.custom_fields;
  if (typeof row?.custom_fields === 'string') {
    try { return JSON.parse(row.custom_fields); } catch (_) {}
  }
  return {};
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, message: 'Method not allowed' });

  try {
    const user = await authenticatedUser(req);
    const { url, key } = supabaseAdminConfig();
    const response = await fetch(
      `${url}/rest/v1/ads?select=*&order=created_at.desc&limit=500`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    const data = await response.json().catch(() => []);
    if (!response.ok) {
      throw new Error(data.message || data.details || 'Could not read your ads.');
    }

    const ads = (Array.isArray(data) ? data : []).filter((row) => {
      const custom = customFields(row);
      return [
        row.user_id,
        row.owner_id,
        row.seller_id,
        row.profile_id,
        row.created_by,
        custom.owner_user_id
      ].some((value) => String(value || '') === String(user.id));
    });

    return json(res, 200, { ok: true, ads });
  } catch (error) {
    const auth = error.message === 'AUTH_REQUIRED';
    return json(res, auth ? 401 : 400, {
      ok: false,
      message: auth ? 'Log in to view your ads.' : (error.message || 'Could not read your ads.')
    });
  }
};
