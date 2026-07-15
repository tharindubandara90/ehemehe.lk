const { json, supabasePublicKey } = require('./_otp-utils');
const { config, rest, normalizeAd, parseJson } = require('./_public-ads-utils');

async function authenticatedUser(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) throw new Error('AUTH_REQUIRED');
  const { url } = config();
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: supabasePublicKey(), Authorization: `Bearer ${token}` }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.id) throw new Error('AUTH_REQUIRED');
  return data;
}

const SELECTS = [
  'id,title,description,price,category_id,city_id,status,condition,created_at,updated_at,phone,custom_fields,featured,promoted',
  'id,title,description,price,category_id,city_id,status,condition,created_at,updated_at,phone,custom_fields',
  'id,title,description,price,category_id,city_id,status,condition,created_at,phone,custom_fields'
];

async function queryOwnedAds(userId) {
  let lastError = null;
  for (const select of SELECTS) {
    const base = new URLSearchParams({ select, order: 'created_at.desc', limit: '200' });
    const attempts = [
      (() => { const p = new URLSearchParams(base); p.set('user_id', `eq.${userId}`); return p; })(),
      (() => { const p = new URLSearchParams(base); p.set('custom_fields->>owner_user_id', `eq.${userId}`); return p; })(),
      base
    ];

    for (let index = 0; index < attempts.length; index += 1) {
      try {
        const rows = await rest(`/rest/v1/ads?${attempts[index].toString()}`, {}, 6000);
        const list = Array.isArray(rows) ? rows : [];
        if (index < 2) return list;
        return list.filter((row) => {
          const custom = parseJson(row.custom_fields, {});
          return [row.user_id, row.owner_id, row.seller_id, row.profile_id, row.created_by, custom.owner_user_id]
            .some((value) => String(value || '') === String(userId));
        });
      } catch (error) {
        lastError = error;
        if (!/column|schema cache|does not exist|could not find|operator/i.test(error.message || '')) break;
      }
    }
  }
  throw lastError || new Error('Could not read your ads.');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, message: 'Method not allowed' });
  try {
    const user = await authenticatedUser(req);
    const rows = await queryOwnedAds(user.id);
    res.setHeader('Cache-Control', 'private, no-store');
    return json(res, 200, { ok: true, ads: rows.map((row) => normalizeAd(row, true)) });
  } catch (error) {
    const auth = error.message === 'AUTH_REQUIRED';
    return json(res, auth ? 401 : 400, {
      ok: false,
      message: auth ? 'Log in to view your ads.' : (error.message || 'Could not read your ads.')
    });
  }
};
