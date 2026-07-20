const { supabaseAdminConfig, supabasePublicKey } = require('./otp-utils');
const { expiryCutoffIso, filterLiveAds } = require('./ad-lifecycle');

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

function slug(value) {
  return String(value || '').toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const PUBLIC_STATUS_VALUES = new Set(['approved', 'active', 'published', 'live']);
const PRIVATE_STATUS_VALUES = new Set(['pending', 'rejected', 'draft', 'blocked', 'deleted', 'expired', 'archived', 'suspended']);

function normalizedStatus(row) {
  const custom = parseJson(row?.custom_fields || row?.customFields, {});
  return String(row?.status || custom.status || '').trim().toLowerCase();
}

function isPublicAdStatus(row) {
  const status = normalizedStatus(row);
  if (PUBLIC_STATUS_VALUES.has(status)) return true;
  if (PRIVATE_STATUS_VALUES.has(status)) return false;

  // The original production schema contains legacy rows without a status
  // value. The old UI treated those rows as approved. Keep that compatibility,
  // while every current publish flow still writes "pending" explicitly.
  if (!status) return true;
  return false;
}

function rowTime(row) {
  const custom = parseJson(row?.custom_fields || row?.customFields, {});
  const value = row?.created_at || row?.createdAt || row?.updated_at || custom.submitted_at || custom.created_at || '';
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function filterPublicRows(rows) {
  return filterLiveAds(Array.isArray(rows) ? rows : [])
    .filter(isPublicAdStatus)
    .sort((a, b) => rowTime(b) - rowTime(a));
}

let categoryLookupCache = { expiresAt: 0, byId: new Map() };

async function loadCategoryLookup() {
  const now = Date.now();
  if (categoryLookupCache.expiresAt > now && categoryLookupCache.byId.size) {
    return categoryLookupCache.byId;
  }

  const selects = [
    'id,name,slug,parent_id,is_active',
    'id,name,slug,parent_id',
    'id,name,slug',
    'id,name'
  ];
  let rows = [];
  let lastError = null;
  for (const select of selects) {
    try {
      const params = new URLSearchParams({ select, limit: '1000' });
      rows = await rest(`/rest/v1/categories?${params.toString()}`, {}, 4500);
      if (Array.isArray(rows)) break;
    } catch (error) {
      lastError = error;
      if (!/column|schema cache|does not exist|could not find/i.test(error.message || '')) break;
    }
  }
  if (!Array.isArray(rows)) {
    if (lastError) throw lastError;
    rows = [];
  }

  const byId = new Map();
  rows.forEach((row) => {
    const id = String(row?.id || '').trim();
    if (!id) return;
    byId.set(id, {
      ...row,
      id,
      slug: slug(row.slug || row.name),
      name: String(row.name || row.slug || '').trim(),
      parent_id: row.parent_id ? String(row.parent_id) : ''
    });
  });
  categoryLookupCache = { expiresAt: now + (5 * 60 * 1000), byId };
  return byId;
}

async function enrichCategoryMetadata(rows) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.some((row) => row?.category_id)) return list;
  let byId;
  try { byId = await loadCategoryLookup(); }
  catch (_) { return list; }
  if (!byId?.size) return list;

  return list.map((row) => {
    const category = byId.get(String(row.category_id || ''));
    if (!category) return row;
    const parent = category.parent_id ? byId.get(String(category.parent_id)) : null;
    return {
      ...row,
      _category_slug: parent?.slug || category.slug || '',
      _category_name: parent?.name || category.name || '',
      _subcategory_slug: parent ? (category.slug || '') : '',
      _subcategory_name: parent ? (category.name || '') : ''
    };
  });
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
  const storedImages = parseJson(row.images, []);
  const storedImageCount = Array.isArray(storedImages) ? storedImages.filter(Boolean).length : 0;
  const declaredImageCount = Number(row._image_count || custom.image_count || custom.images_count || 0);
  const imageCount = Math.max(storedImageCount, Number.isFinite(declaredImageCount) ? declaredImageCount : 0, row.image_url ? 1 : 0);
  const proxyCount = detail ? Math.max(1, imageCount) : 1;
  const publicImages = id
    ? Array.from({ length: proxyCount }, (_, index) => imageProxy(id, index))
    : [];
  return {
    id,
    title: row.title || 'Untitled Ad',
    description: row.description || '',
    price: Number(row.price || 0),
    currency: row.currency || 'LKR',
    condition: row.condition || custom.condition || '',
    categoryId: custom.category_slug || row._category_slug || row.category_id || '',
    categoryName: custom.category_name || row._category_name || '',
    subcategoryId: custom.subcategory_slug || row._subcategory_slug || '',
    subcategoryName: custom.subcategory_name || row._subcategory_name || '',
    district: custom.district || '',
    city: custom.city || '',
    location: [custom.city, custom.district].filter(Boolean).join(', ') || row.location || '',
    images: publicImages,
    image_url: publicImages[0] || '',
    imageCount,
    contactPhones: phones,
    contactEmail: custom.owner_contact_email || row.email || '',
    sellerName: custom.owner_name || 'Seller',
    status: row.status || '',
    featured: Boolean(row.featured || row.is_featured || String(row.promotion_type || '').toLowerCase() === 'featured'),
    promoted: Boolean(row.promoted || row.is_promoted || ['promoted', 'top'].includes(String(row.promotion_type || '').toLowerCase())),
    promotionType: String(row.promotion_type || '').toLowerCase(),
    promotion_type: String(row.promotion_type || '').toLowerCase(),
    createdAt: row.created_at || custom.submitted_at || '',
    created_at: row.created_at || custom.submitted_at || '',
    viewCount: Number(row.views || row.view_count || 0),
    customFields: detail ? custom : undefined,
    custom_fields: detail ? custom : undefined
  };
}

const LIST_SELECTS = [
  'id,title,description,price,currency,category_id,city_id,status,condition,created_at,updated_at,expires_at,is_featured,is_promoted,promotion_type,phone,custom_fields,views,view_count',
  'id,title,description,price,currency,category_id,city_id,status,condition,created_at,expires_at,is_featured,is_promoted,promotion_type,phone,custom_fields',
  'id,title,description,price,category_id,city_id,status,condition,created_at,expires_at,is_featured,is_promoted,promotion_type,phone,custom_fields',
  'id,title,description,price,category_id,city_id,status,condition,created_at,is_featured,is_promoted,promotion_type,phone,custom_fields,views,view_count',
  'id,title,description,price,category_id,city_id,status,condition,created_at,is_featured,is_promoted,promotion_type,phone,custom_fields',
  'id,title,description,price,category_id,city_id,status,condition,created_at,featured,promoted,promotion_type,phone,custom_fields',
  'id,title,description,price,category_id,city_id,status,condition,created_at,featured,promoted,phone,custom_fields',
  'id,title,description,price,category_id,city_id,status,condition,created_at,phone,custom_fields',
  'id,title,description,price,category_id,city_id,status,condition,phone,custom_fields',
  'id,title,description,price,category_id,city_id,condition,phone,custom_fields',
  'id,title,description,price,category_id,city_id,phone,custom_fields',
  'id,title,description,price,custom_fields',
  'id,title,description,price'
];

function isSchemaCompatibilityError(error) {
  return /column|schema cache|does not exist|could not find|42703|PGRST204|PGRST205/i.test(String(error?.message || error || ''));
}

async function queryAds({ id = '', limit = 60, approvedOnly = true } = {}) {
  let lastError = null;
  const safeLimit = id ? 1 : Math.max(1, Math.min(Number(limit) || 60, 500));
  // PostgREST applies limit before our schema-compatible status/expiry filter.
  // Fetch a wider window so pending/rejected rows cannot crowd approved ads out
  // of public Home, All Ads, and category pages.
  const fetchLimit = id ? 1 : Math.max(safeLimit, Math.min(1000, safeLimit * 8));

  for (const select of LIST_SELECTS) {
    const attempts = [];
    const ordered = select.includes('created_at');
    attempts.push({ order: ordered ? 'created_at.desc' : '' });
    if (ordered) attempts.push({ order: '' });

    for (const attempt of attempts) {
      const params = new URLSearchParams({ select, limit: String(fetchLimit) });
      if (id) params.set('id', `eq.${id}`);
      if (attempt.order) params.set('order', attempt.order);

      try {
        const data = await rest(`/rest/v1/ads?${params.toString()}`, {}, id ? 8000 : 6500);
        const rows = Array.isArray(data) ? data : [];
        const visibleRows = approvedOnly ? filterPublicRows(rows) : filterLiveAds(rows);
        return enrichCategoryMetadata(visibleRows.slice(0, safeLimit));
      } catch (error) {
        lastError = error;
        if (!isSchemaCompatibilityError(error)) break;
      }
    }

    if (lastError && !isSchemaCompatibilityError(lastError)) break;
  }
  throw lastError || new Error('Could not load ads.');
}

async function queryAdImageCount(id) {
  const cleanId = String(id || '').trim();
  if (!cleanId) return 0;
  const params = new URLSearchParams({ select: 'image_url,images', id: `eq.${cleanId}`, limit: '1' });
  const rows = await rest(`/rest/v1/ads?${params.toString()}`, {}, 8000);
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return 0;
  const images = parseJson(row.images, []);
  return Math.max(Array.isArray(images) ? images.filter(Boolean).length : 0, row.image_url ? 1 : 0);
}

module.exports = {
  config,
  rest,
  parseJson,
  normalizeAd,
  imageProxy,
  queryAds,
  queryAdImageCount,
  enrichCategoryMetadata,
  loadCategoryLookup,
  isPublicAdStatus,
  normalizedStatus,
  filterPublicRows,
  isSchemaCompatibilityError
};
