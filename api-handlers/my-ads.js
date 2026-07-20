const {
  json, supabasePublicKey, supabaseAdminConfig
} = require('../lib/otp-utils');
const { expiryCutoffIso, filterLiveAds } = require('../lib/ad-lifecycle');

const AUTH_TIMEOUT_MS = 5000;
const ADS_TIMEOUT_MS = 6500;
const DASHBOARD_SELECT_WITH_USER = 'id,user_id,title,description,price,status,condition,created_at,custom_fields';
const DASHBOARD_SELECT_OWNER = 'id,title,description,price,status,condition,created_at,custom_fields';
const DASHBOARD_SELECT_COMPAT = 'id,title,price,status,created_at,custom_fields';

async function fetchJson(url, options = {}, timeoutMs = ADS_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    return { response, data };
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('MY_ADS_TIMEOUT');
    throw error;
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
  }, AUTH_TIMEOUT_MS);
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

function compactOwnedRows(rows, userId) {
  return filterLiveAds(Array.isArray(rows) ? rows : [])
    .filter((row) => belongsToUser(row, userId))
    .map((row) => ({
      ...row,
      custom_fields: customFields(row),
      image_url: `/api/ad-image?id=${encodeURIComponent(String(row.id || ''))}&index=0`,
      images: []
    }));
}

async function requestAds(url, key, select, filters = {}) {
  const params = new URLSearchParams({
    select,
    order: 'created_at.desc',
    limit: '200',
    ...filters
  });
  try {
    const { response, data } = await fetchJson(`${url}/rest/v1/ads?${params.toString()}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }
    });
    if (response.ok) return { ok: true, rows: data, error: null, data };
    const message = data?.message || data?.details || data?.hint || 'Could not read your ads.';
    return {
      ok: false,
      rows: [],
      error: new Error(message),
      data,
      schemaMissing: missingColumnOrTable(data, message),
      userIdMissing: missingUserIdColumn(data, message)
    };
  } catch (error) {
    return { ok: false, rows: [], error, data: {}, schemaMissing: false, userIdMissing: false };
  }
}

function mergeOwnedResults(results, userId) {
  const byId = new Map();
  for (const result of results) {
    if (!result?.ok) continue;
    for (const row of compactOwnedRows(result.rows, userId)) {
      const key = String(row.id || `${row.title || ''}|${row.created_at || ''}`);
      byId.set(key, { ...(byId.get(key) || {}), ...row });
    }
  }
  return Array.from(byId.values())
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

async function readOwnedAds(url, key, userId) {
  // Both ownership layouts are queried at the same time. The old implementation
  // waited for several schema fallbacks one after another, which made the
  // dashboard sit on the bundled count before real rows appeared.
  const [ownerResult, directResult] = await Promise.all([
    requestAds(url, key, DASHBOARD_SELECT_OWNER, {
      'custom_fields->>owner_user_id': `eq.${userId}`,
      created_at: `gte.${expiryCutoffIso()}`
    }),
    requestAds(url, key, DASHBOARD_SELECT_WITH_USER, {
      user_id: `eq.${userId}`,
      created_at: `gte.${expiryCutoffIso()}`
    })
  ]);

  const owned = mergeOwnedResults([ownerResult, directResult], userId);
  if (owned.length) return owned;

  // If either filtered query completed successfully, an empty merged result is
  // a valid empty account. Do not start a long retry chain.
  if (ownerResult.ok || directResult.ok) return [];

  // A single compatibility scan is reserved for an old/schema-cache database
  // where neither filtered query can execute. Rows are still ownership-filtered
  // in-process before anything is returned to the browser.
  if (ownerResult.schemaMissing || directResult.schemaMissing || directResult.userIdMissing) {
    const compatibility = await requestAds(url, key, DASHBOARD_SELECT_COMPAT, {
      created_at: `gte.${expiryCutoffIso()}`
    });
    if (compatibility.ok) return compactOwnedRows(compatibility.rows, userId)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    if (compatibility.schemaMissing) throw new Error('DATABASE_SCHEMA_MISSING_ADS');
    throw compatibility.error || ownerResult.error || directResult.error || new Error('Could not read your ads.');
  }

  const error = ownerResult.error || directResult.error || new Error('Could not read your ads.');
  if (error.message === 'MY_ADS_TIMEOUT') throw new Error('MY_ADS_TIMEOUT');
  throw error;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, message: 'Method not allowed' });

  try {
    const user = await authenticatedUser(req);
    const { url, key } = supabaseAdminConfig();
    const ads = await readOwnedAds(url, key, user.id);

    res.setHeader?.('Cache-Control', 'no-store');
    return json(res, 200, { ok: true, ads });
  } catch (error) {
    const auth = error.message === 'AUTH_REQUIRED';
    const schemaMissing = error.message === 'DATABASE_SCHEMA_MISSING_ADS';
    const timeout = error.message === 'MY_ADS_TIMEOUT';
    return json(res, auth ? 401 : (schemaMissing ? 503 : (timeout ? 504 : 400)), {
      ok: false,
      code: schemaMissing ? 'DATABASE_SCHEMA_MISSING_ADS' : (timeout ? 'MY_ADS_TIMEOUT' : undefined),
      message: auth
        ? 'Log in to view your ads.'
        : schemaMissing
          ? 'Marketplace database setup is incomplete. Run supabase_marketplace_core_schema.sql once in the Supabase SQL Editor.'
          : timeout
            ? 'Your ads took too long to load. Please retry.'
            : (error.message || 'Could not read your ads.')
    });
  }
};
