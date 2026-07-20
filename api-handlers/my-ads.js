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

async function readOwnedAds(url, key, userId) {
  // Keep the dashboard response compact. Full Base64 image arrays are loaded
  // lazily through /api/ad-image, so My Ads can paint without downloading
  // every photo before the list becomes visible.
  const directSelects = [
    'id,user_id,title,description,price,status,condition,created_at,updated_at,view_count,custom_fields',
    'id,user_id,title,description,price,status,condition,city,district,created_at,updated_at,view_count,views,custom_fields',
    'id,user_id,title,description,price,status,condition,created_at,custom_fields',
    'id,user_id,title,description,price,status,created_at,custom_fields',
    'id,user_id,title,price,status,created_at,custom_fields'
  ];

  let lastError = null;
  let directQuerySupported = true;

  for (const select of directSelects) {
    const { response, data } = await requestAds(url, key, select, { user_id: `eq.${userId}` });
    if (response.ok) {
      const rows = compactOwnedRows(data, userId);
      if (rows.length) return rows;
      break;
    }

    const message = data.message || data.details || data.hint || 'Could not read your ads.';
    lastError = new Error(message);
    if (missingUserIdColumn(data, message)) {
      directQuerySupported = false;
      break;
    }
    if (!missingColumnOrTable(data, message)) throw lastError;
  }

  // Older deployments saved ownership only in custom_fields.owner_user_id
  // after a missing user_id column forced publish-ad's compatibility insert.
  // Query that JSON owner directly instead of returning an empty dashboard.
  const ownerSelects = [
    'id,title,description,price,status,condition,created_at,updated_at,view_count,custom_fields',
    'id,title,description,price,status,condition,city,district,created_at,updated_at,view_count,views,custom_fields',
    'id,title,description,price,status,condition,created_at,custom_fields',
    'id,title,description,price,status,created_at,custom_fields',
    'id,title,price,status,created_at,custom_fields'
  ];

  for (const select of ownerSelects) {
    const { response, data } = await requestAds(url, key, select, {
      'custom_fields->>owner_user_id': `eq.${userId}`
    });
    if (response.ok) return compactOwnedRows(data, userId);

    const message = data.message || data.details || data.hint || 'Could not read your ads.';
    lastError = new Error(message);
    if (!missingColumnOrTable(data, message)) throw lastError;
  }

  // Final compact compatibility scan. It is reached only when an old schema
  // cannot filter either user_id or the JSON owner through PostgREST.
  const compatibilitySelects = [
    'id,user_id,title,description,price,status,condition,created_at,updated_at,view_count,custom_fields',
    'id,title,description,price,status,condition,created_at,updated_at,view_count,custom_fields',
    'id,title,price,status,created_at,custom_fields'
  ];
  for (const select of compatibilitySelects) {
    const params = new URLSearchParams({ select, order: 'created_at.desc', limit: '500' });
    const response = await fetch(`${url}/rest/v1/ads?${params.toString()}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }
    });
    const data = await response.json().catch(() => []);
    if (response.ok) return compactOwnedRows(data, userId);

    const message = data.message || data.details || lastError?.message || 'Could not read your ads.';
    lastError = new Error(message);
    if (!missingColumnOrTable(data, message)) throw lastError;
  }

  const fallbackMessage = lastError?.message || 'Could not read your ads.';
  if (missingColumnOrTable({}, fallbackMessage)) throw new Error('DATABASE_SCHEMA_MISSING_ADS');
  if (!directQuerySupported && /user_id/i.test(fallbackMessage)) return [];
  throw new Error(fallbackMessage);
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
