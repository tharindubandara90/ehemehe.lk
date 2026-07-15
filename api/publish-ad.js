const {
  json, normalizePhone, isSriLankaMobile, readToken,
  supabasePublicKey, supabaseAdminConfig
} = require('./_otp-utils');

function readLargeBody(req, maxBytes = 5 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body, 'utf8') > maxBytes) {
        reject(new Error('The selected photos are too large. Remove a photo or choose smaller images.'));
      }
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (_) { reject(new Error('Invalid JSON body.')); }
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
    categoryId: category?.id || body.subcategoryId || body.categoryId || null,
    cityId: city?.id || null,
    category,
    city,
    district
  };
}

function decodeImageDataUrl(value) {
  const match = String(value || '').match(/^data:([^;,]+);base64,(.+)$/s);
  if (!match) return null;
  const mime = match[1].toLowerCase();
  if (!['image/jpeg','image/png','image/webp','image/heic','image/heif'].includes(mime)) {
    throw new Error('Unsupported photo format. Use JPG, PNG, WebP or HEIC.');
  }
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > 3 * 1024 * 1024) {
    throw new Error('Each photo must be smaller than 3 MB after optimization.');
  }
  const extension = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : mime.includes('heic') || mime.includes('heif') ? 'heic' : 'jpg';
  return { mime, buffer, extension };
}

async function ensureAdImagesBucket() {
  const { url, key } = supabaseAdminConfig();
  const response = await fetch(`${url}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: 'ad-images',
      name: 'ad-images',
      public: true,
      file_size_limit: 5242880,
      allowed_mime_types: ['image/jpeg','image/png','image/webp','image/heic','image/heif']
    })
  });
  if (response.ok || response.status === 409) return;
  const data = await response.json().catch(() => ({}));
  if (response.status === 400 && /exist|duplicate/i.test(String(data.message || data.error || ''))) return;

  // Older Storage API versions may reject optional bucket settings. Retry with
  // the smallest supported public-bucket payload before failing.
  if (response.status === 400) {
    const retry = await fetch(`${url}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: 'ad-images', name: 'ad-images', public: true })
    });
    if (retry.ok || retry.status === 409) return;
    const retryData = await retry.json().catch(() => ({}));
    if (/exist|duplicate/i.test(String(retryData.message || retryData.error || ''))) return;
    throw new Error(retryData.message || `Could not prepare photo storage (HTTP ${retry.status}).`);
  }

  throw new Error(data.message || `Could not prepare photo storage (HTTP ${response.status}).`);
}

async function uploadAdImages(images, userId) {
  if (!images.length) return [];
  await ensureAdImagesBucket();
  const { url, key } = supabaseAdminConfig();
  const output = [];

  for (let index = 0; index < images.length; index += 1) {
    const value = String(images[index] || '');
    if (/^https?:\/\//i.test(value)) {
      output.push(value);
      continue;
    }

    const decoded = decodeImageDataUrl(value);
    if (!decoded) throw new Error('A selected photo could not be read. Please choose it again.');
    const safeUser = String(userId || 'user').replace(/[^a-zA-Z0-9_-]/g, '');
    const objectPath = `${safeUser}/${Date.now()}-${index}-${Math.random().toString(36).slice(2,8)}.${decoded.extension}`;
    const upload = await fetch(`${url}/storage/v1/object/ad-images/${objectPath}`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': decoded.mime,
        'Content-Length': String(decoded.buffer.length),
        'x-upsert': 'false'
      },
      body: decoded.buffer
    });
    if (!upload.ok) {
      const data = await upload.json().catch(() => ({}));
      throw new Error(data.message || `Photo ${index + 1} could not be uploaded.`);
    }
    output.push(`${url}/storage/v1/object/public/ad-images/${objectPath}`);
  }

  return output;
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
    (() => { const copy = { ...payload }; delete copy.user_id; return copy; })(),
    (() => {
      const copy = { ...payload };
      delete copy.user_id;
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

    const retryable = /column|schema cache|foreign key|violates|not present/i.test(lastMessage);
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
    const rawImages = Array.isArray(body.images) ? body.images.slice(0, 10) : [];

    if (title.length < 3) throw new Error('Enter a valid ad title.');
    if (description.length < 5) throw new Error('Enter a complete description.');
    if (!Number.isFinite(price) || price < 0) throw new Error('Enter a valid price.');
    if (!body.district || !body.city) throw new Error('Select both district and city.');
    if (!phones.length || phones.length > 5) throw new Error('Add between 1 and 5 contact numbers.');
    if (phones.some((phone) => !isSriLankaMobile(normalizePhone(phone)))) {
      throw new Error('One of the contact numbers is invalid.');
    }

    const verifiedPhones = validatePhoneProof(body.phoneProof, phones);
    const images = await uploadAdImages(rawImages, user.id);
    const lookups = await resolveLookups(body);
    const metadata = user.user_metadata || {};

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
      submitted_at: new Date().toISOString()
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
    return json(res, auth ? 401 : 400, {
      ok: false,
      message: auth ? 'Log in before publishing an ad.' : (error.message || 'Could not publish the ad.')
    });
  }
};
