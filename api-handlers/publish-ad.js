const {
  json, normalizePhone, isSriLankaMobile, readToken,
  supabasePublicKey, supabaseAdminConfig
} = require('../lib/otp-utils');
const { expiresAtIso } = require('../lib/ad-lifecycle');

function readLargeBody(req, maxBytes = 5 * 1024 * 1024) {
  const parseValue = (value) => {
    if (value === undefined || value === null || value === '') return {};
    if (Buffer.isBuffer(value)) value = value.toString('utf8');
    if (typeof value === 'string') {
      if (Buffer.byteLength(value, 'utf8') > maxBytes) throw new Error('The selected photos are too large. Remove a photo or choose smaller images.');
      try { return value ? JSON.parse(value) : {}; }
      catch (_) { throw new Error('Invalid JSON body.'); }
    }
    if (typeof value === 'object') {
      if (Buffer.byteLength(JSON.stringify(value), 'utf8') > maxBytes) throw new Error('The selected photos are too large. Remove a photo or choose smaller images.');
      return value;
    }
    throw new Error('Invalid JSON body.');
  };

  if (req.body !== undefined && req.body !== null) {
    return Promise.resolve().then(() => parseValue(req.body));
  }

  return new Promise((resolve, reject) => {
    let body = '';
    let settled = false;
    req.on('data', (chunk) => {
      if (settled) return;
      body += chunk;
      if (Buffer.byteLength(body, 'utf8') > maxBytes) {
        settled = true;
        reject(new Error('The selected photos are too large. Remove a photo or choose smaller images.'));
      }
    });
    req.on('end', () => {
      if (settled) return;
      try { resolve(parseValue(body)); }
      catch (error) { reject(error); }
    });
    req.on('error', reject);
  });
}

function slug(value) {
  return String(value || '').toLowerCase()
    .replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function authenticatedUser(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) throw new Error('AUTH_REQUIRED');

  const { url } = supabaseAdminConfig();
  const publicKey = supabasePublicKey();
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: publicKey,
      Authorization: `Bearer ${token}`
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.id) throw new Error('AUTH_REQUIRED');
  return data;
}

async function restRows(table, select = '*') {
  const { url, key } = supabaseAdminConfig();
  const response = await fetch(
    `${url}/rest/v1/${table}?select=${encodeURIComponent(select)}&limit=1000`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  if (!response.ok) return [];
  return response.json().catch(() => []);
}

function matchBySlug(rows, values) {
  const wanted = values.map(slug).filter(Boolean);
  return rows.find((row) => {
    const candidates = [row.id, row.slug, row.name].map(slug);
    return wanted.some((value) => candidates.includes(value));
  }) || null;
}

async function resolveLookups(body) {
  const [categories, districts, cities] = await Promise.all([
    restRows('categories', 'id,name,slug'),
    restRows('districts', 'id,name,slug'),
    restRows('cities', 'id,name,district_id')
  ]);

  const category = matchBySlug(categories, [body.subcategoryId, body.subcategoryName, body.categoryId, body.categoryName]);
  const district = matchBySlug(districts, [body.district]);

  const cityWanted = slug(body.city);
  const city = cities.find((row) => {
    if (slug(row.name) !== cityWanted) return false;
    if (!district) return true;
    return String(row.district_id) === String(district.id);
  }) || cities.find((row) => slug(row.name) === cityWanted) || null;

  return {
    // Only store lookup IDs that actually exist in this Supabase project.
    // Category/city slugs and names remain safely preserved in custom_fields.
    categoryId: category?.id || null,
    cityId: city?.id || null,
    category,
    city,
    district
  };
}

function validatePhoneProof(proof, phones) {
  const data = readToken(proof);
  const normalized = phones.map(normalizePhone);

  if (
    data.kind !== 'ad_contact_phones_verified' ||
    data.verified !== true ||
    Date.now() > Number(data.expiresAt || 0)
  ) {
    throw new Error('Phone verification is invalid or expired.');
  }

  const proofPhones = Array.isArray(data.phones) ? data.phones.map(normalizePhone) : [];
  if (
    proofPhones.length !== normalized.length ||
    normalized.some((phone, index) => phone !== proofPhones[index])
  ) {
    throw new Error('The verified phone numbers do not match this ad.');
  }

  return normalized;
}

async function insertAd(payload) {
  const { url, key } = supabaseAdminConfig();
  const attempts = [
    payload,
    (() => { const copy = { ...payload }; delete copy.expires_at; return copy; })(),
    (() => { const copy = { ...payload }; delete copy.user_id; return copy; })(),
    (() => { const copy = { ...payload }; delete copy.user_id; delete copy.expires_at; return copy; })(),
    (() => {
      const copy = { ...payload };
      delete copy.user_id;
      delete copy.expires_at;
      delete copy.images;
      return copy;
    })()
  ];

  let lastMessage = 'Could not save the ad.';
  for (const attempt of attempts) {
    const response = await fetch(`${url}/rest/v1/ads`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(attempt)
    });
    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch (_) { data = { message: raw }; }

    if (response.ok) return Array.isArray(data) ? data[0] : data;
    lastMessage = data.message || data.details || data.hint || `HTTP ${response.status}`;

    const missingAdsTable =
      data.code === 'PGRST205' ||
      data.code === '42P01' ||
      /could not find the table ['"]?public\.ads|relation ['"]?public\.ads|relation ['"]?ads['"]? does not exist/i.test(lastMessage);
    if (missingAdsTable) throw new Error('DATABASE_SCHEMA_MISSING_ADS');

    const retryable = /column|foreign key|violates|not present/i.test(lastMessage);
    if (!retryable) break;
  }

  throw new Error(`Supabase rejected the ad: ${lastMessage}`);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, message: 'Method not allowed' });

  try {
    const user = await authenticatedUser(req);
    const body = await readLargeBody(req);

    const title = String(body.title || '').trim();
    const description = String(body.description || '').trim();
    const price = Number(String(body.price || '').replace(/[^\d.]/g, ''));
    const phones = Array.isArray(body.phones) ? body.phones : [];
    const images = Array.isArray(body.images) ? body.images.slice(0, 10) : [];

    if (title.length < 3) throw new Error('Enter a valid ad title.');
    if (description.length < 5) throw new Error('Enter a complete description.');
    if (!Number.isFinite(price) || price < 0) throw new Error('Enter a valid price.');
    if (!body.district || !body.city) throw new Error('Select both district and city.');
    if (!phones.length || phones.length > 5) throw new Error('Add between 1 and 5 contact numbers.');
    if (phones.some((phone) => !isSriLankaMobile(normalizePhone(phone)))) {
      throw new Error('One of the contact numbers is invalid.');
    }

    const verifiedPhones = validatePhoneProof(body.phoneProof, phones);
    const lookups = await resolveLookups(body);
    const metadata = user.user_metadata || {};
    const expiresAt = expiresAtIso();

    const customFields = {
      ...(body.customFields && typeof body.customFields === 'object' ? body.customFields : {}),
      owner_user_id: user.id,
      owner_name: metadata.name || metadata.full_name || '',
      owner_contact_email: metadata.contact_email || '',
      category_slug: slug(body.categoryId),
      category_name: body.categoryName || '',
      subcategory_slug: slug(body.subcategoryId),
      subcategory_name: body.subcategoryName || '',
      district: body.district,
      city: body.city,
      contact_phones: verifiedPhones,
      verified_contact_phones: verifiedPhones,
      phone_verification_proof: body.phoneProof,
      image_count: images.length,
      submitted_at: new Date().toISOString(),
      expires_at: expiresAt
    };

    const payload = {
      user_id: user.id,
      title,
      description,
      price,
      phone: verifiedPhones[0],
      status: 'pending',
      category_id: lookups.categoryId,
      city_id: lookups.cityId,
      condition: body.condition || null,
      image_url: images[0] || null,
      images,
      custom_fields: customFields,
      expires_at: expiresAt,
      updated_at: new Date().toISOString()
    };

    const ad = await insertAd(payload);
    return json(res, 200, {
      ok: true,
      message: 'Ad submitted successfully.',
      ad: {
        ...ad,
        status: ad?.status || 'pending',
        created_at: ad?.created_at || new Date().toISOString()
      }
    });
  } catch (error) {
    const auth = error.message === 'AUTH_REQUIRED';
    const schemaMissing = error.message === 'DATABASE_SCHEMA_MISSING_ADS';
    return json(res, auth ? 401 : (schemaMissing ? 503 : 400), {
      ok: false,
      code: schemaMissing ? 'DATABASE_SCHEMA_MISSING_ADS' : undefined,
      message: auth
        ? 'Log in before publishing an ad.'
        : schemaMissing
          ? 'Marketplace database setup is incomplete. Run supabase_marketplace_core_schema.sql once in the Supabase SQL Editor.'
          : (error.message || 'Could not publish the ad.')
    });
  }
};
