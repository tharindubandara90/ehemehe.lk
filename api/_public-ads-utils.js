const { supabaseAdminConfig, supabasePublicKey } = require('./_otp-utils');

function timeoutSignal(ms = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer)
  };
}

function config() {
  try {
    return supabaseAdminConfig();
  } catch (_) {
    const url = String(process.env.SUPABASE_URL || 'https://ieymsjeywkapqeniirlm.supabase.co').replace(/\/$/, '');
    return { url, key: supabasePublicKey() };
  }
}

async function rest(pathname, options = {}, timeoutMs = 6000) {
  const { url, key } = config();
  const timed = timeoutSignal(timeoutMs);
  try {
    const response = await fetch(`${url}${pathname}`, {
      ...options,
      signal: timed.signal,
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
      const detail = data?.message || data?.details || data?.hint || String(data || `HTTP ${response.status}`);
      const error = new Error(detail);
      error.status = response.status;
      throw error;
    }
    return data;
  } finally {
    timed.clear();
  }
}

function parseJson(value, fallback) {
  if (value && typeof value === 'object') return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch (_) {}
  }
  return fallback;
}

function normalizePhoneList(row, custom) {
  return Array.from(new Set([
    row.phone,
    ...(Array.isArray(custom.contact_phones) ? custom.contact_phones : []),
    ...(Array.isArray(custom.verified_contact_phones) ? custom.verified_contact_phones : [])
  ].filter(Boolean)));
}

function imageProxy(id, index = 0) {
  return `/api/ad-image?id=${encodeURIComponent(String(id))}&index=${index}`;
}

function normalizeAd(row, detail = false) {
  const custom = parseJson(row.custom_fields, {});
  const phones = normalizePhoneList(row, custom);
  const id = String(row.id ?? '');
  return {
    id,
    title: row.title || 'Untitled Ad',
    description: row.description || '',
    price: Number(row.price || 0),
    currency: row.currency || 'LKR',
    condition: row.condition || custom.condition || '',
    categoryId: custom.category_slug || row.category_id || '',
    categoryName: custom.category_name || '',
    subcategoryId: custom.subcategory_slug || '',
    subcategoryName: custom.subcategory_name || '',
    district: custom.district || '',
    city: custom.city || '',
    location: [custom.city, custom.district].filter(Boolean).join(', ') || row.location || '',
    images: id ? [imageProxy(id, 0)] : [],
    image_url: id ? imageProxy(id, 0) : '',
    contactPhones: phones,
    contactEmail: custom.owner_contact_email || row.email || '',
    sellerName: custom.owner_name || 'Seller',
    status: row.status || '',
    featured: Boolean(row.featured || row.is_featured),
    promoted: Boolean(row.promoted || row.is_promoted),
    createdAt: row.created_at || custom.submitted_at || '',
    created_at: row.created_at || custom.submitted_at || '',
    viewCount: Number(row.views || row.view_count || 0),
    customFields: detail ? custom : undefined,
    custom_fields: detail ? custom : undefined
  };
}

const LIST_SELECTS = [
  'id,title,description,price,category_id,city_id,status,condition,created_at,featured,promoted,phone,custom_fields,views,view_count',
  'id,title,description,price,category_id,city_id,status,condition,created_at,featured,promoted,phone,custom_fields',
  'id,title,description,price,category_id,city_id,status,condition,created_at,phone,custom_fields',
  'id,title,description,price,category_id,city_id,status,condition,created_at,phone',
  'id,title,description,price,status,condition,created_at,phone'
];

async function queryAds({ id = '', limit = 60, approvedOnly = true } = {}) {
  let lastError = null;
  for (const select of LIST_SELECTS) {
    const params = new URLSearchParams({ select });
    if (id) params.set('id', `eq.${id}`);
    if (approvedOnly) params.set('status', 'eq.approved');
    params.set('order', 'created_at.desc');
    params.set('limit', String(id ? 1 : Math.max(1, Math.min(Number(limit) || 60, 120))));
    try {
      const data = await rest(`/rest/v1/ads?${params.toString()}`, {}, id ? 6500 : 5000);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      lastError = error;
      if (!/column|schema cache|does not exist|could not find/i.test(error.message || '')) break;
    }
  }
  throw lastError || new Error('Could not load ads.');
}

module.exports = {
  config,
  rest,
  parseJson,
  normalizeAd,
  imageProxy,
  queryAds
};
