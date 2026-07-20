const {
  json, supabasePublicKey, supabaseAdminConfig
} = require('../lib/otp-utils');

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

function belongsToUser(row, userId) {
  const custom = customFields(row);
  return [
    row.user_id,
    row.owner_id,
    row.seller_id,
    row.profile_id,
    row.created_by,
    custom.owner_user_id
  ].some((value) => String(value || '') === String(userId));
}

function missingColumnOrTable(data, message) {
  const text = [data?.message, data?.details, data?.hint, message].filter(Boolean).join(' ');
  return data?.code === 'PGRST204' || data?.code === 'PGRST205' ||
    data?.code === '42P01' || data?.code === '42703' ||
    /could not find the table ['"]?public\.ads|relation ['"]?public\.ads|relation ['"]?ads['"]? does not exist|could not find (?:the )?['"]?[^'"]+['"]? column|column .* does not exist|schema cache/i.test(text);
}

function missingUserIdColumn(data, message) {
  const text = [data?.message, data?.details, data?.hint, message].filter(Boolean).join(' ');
  return /user_id/i.test(text) && (
    data?.code === 'PGRST204' || data?.code === '42703' ||
    /could not find (?:the )?['"]?user_id['"]? column|column .*user_id.*does not exist|schema cache/i.test(text)
  );
}

async function requestAds(url, key, select, filters) {
  const params = new URLSearchParams({
    select,
    order: 'created_at.desc',
    limit: '200',
    ...filters
  });
  const response = await fetch(`${url}/rest/v1/ads?${params.toString()}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }
  });
  const data = await response.json().catch(() => []);
  return { response, data };
}

function compactOwnedRows(rows, userId) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => belongsToUser(row, userId))
    .map((row) => ({
      ...row,
      image_url: `/api/ad-image?id=${encodeURIComponent(String(row.id || ''))}&index=0`,
      images: []
    }));
}

async function queryOwnedRows(url, key, userId, selects, filters, stopWhenUserIdMissing = false) {
  let lastError = null;
  for (const select of selects) {
    const { response, data } = await requestAds(url, key, select, filters);
    if (response.ok) {
      return { ok: true, rows: compactOwnedRows(data, userId), lastError: null, userIdMissing: false };
    }

    const message = data.message || data.details || data.hint || 'Could not read your ads.';
    lastError = new Error(message);
    if (stopWhenUserIdMissing && missingUserIdColumn(data, message)) {
      return { ok: false, rows: [], lastError, userIdMissing: true };
    }
    if (!missingColumnOrTable(data, message)) throw lastError;
  }
  return { ok: false, rows: [], lastError, userIdMissing: false };
}

async function readOwnedAds(url, key, userId) {
  // The dashboard only needs compact metadata. Images stay lazy through
  // /api/ad-image. Start with stable core columns so older schemas do not spend
  // many seconds retrying optional updated_at/view_count/city/district columns.
  const directSelects = [
    'id,user_id,title,description,price,status,condition,created_at,custom_fields',
    'id,user_id,title,price,status,created_at,custom_fields'
  ];
  const ownerSelects = [
    'id,title,description,price,status,condition,created_at,custom_fields',
    'id,title,price,status,created_at,custom_fields'
  ];

  // Every ad published by the current application records owner_user_id in
  // custom_fields, including databases that also have a user_id column. Query
  // that stable owner field first so the live legacy schema finishes in one
  // compact request instead of waiting for a known-missing user_id query.
  const owner = await queryOwnedRows(
    url,
    key,
    userId,
    ownerSelects,
    { 'custom_fields->>owner_user_id': `eq.${userId}` }
  );
  if (owner.ok && owner.rows.length) return owner.rows;

  // Older rows may only have the relational user_id ownership field. Use it as
  // a compatibility fallback when the JSON owner query is empty or unsupported.
  const direct = await queryOwnedRows(
    url,
    key,
    userId,
    directSelects,
    { user_id: `eq.${userId}` },
    true
  );
  if (direct.ok) return direct.rows;
  if (owner.ok) return owner.rows;

  // Final compatibility scan is intentionally one compact request, not a long
  // chain of full-row retries. The result is still filtered again in-process.
  const compatibilitySelect = direct.userIdMissing
    ? 'id,title,price,status,created_at,custom_fields'
    : 'id,user_id,title,price,status,created_at,custom_fields';
  const params = new URLSearchParams({
    select: compatibilitySelect,
    order: 'created_at.desc',
    limit: '500'
  });
  const response = await fetch(`${url}/rest/v1/ads?${params.toString()}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }
  });
  const data = await response.json().catch(() => []);
  if (response.ok) return compactOwnedRows(data, userId);

  const message = data.message || data.details || owner.lastError?.message || direct.lastError?.message || 'Could not read your ads.';
  if (missingColumnOrTable(data, message)) throw new Error('DATABASE_SCHEMA_MISSING_ADS');
  throw new Error(message);
}


module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, message: 'Method not allowed' });

  try {
    const user = await authenticatedUser(req);
    const { url, key } = supabaseAdminConfig();
    const ads = await readOwnedAds(url, key, user.id);

    res.setHeader?.('Cache-Control', 'private, no-store, max-age=0');
    return json(res, 200, { ok: true, ads });
  } catch (error) {
    const auth = error.message === 'AUTH_REQUIRED';
    const schemaMissing = error.message === 'DATABASE_SCHEMA_MISSING_ADS';
    return json(res, auth ? 401 : (schemaMissing ? 503 : 400), {
      ok: false,
      code: schemaMissing ? 'DATABASE_SCHEMA_MISSING_ADS' : undefined,
      message: auth
        ? 'Log in to view your ads.'
        : schemaMissing
          ? 'Marketplace database setup is incomplete. Run supabase_marketplace_core_schema.sql once in the Supabase SQL Editor.'
          : (error.message || 'Could not read your ads.')
    });
  }
};
