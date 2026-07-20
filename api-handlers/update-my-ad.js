const {
  json, supabasePublicKey, supabaseAdminConfig
} = require('../lib/otp-utils');

function readLargeBody(req, maxBytes = 5 * 1024 * 1024) {
  const parseValue = (value) => {
    if (value === undefined || value === null || value === '') return {};
    if (Buffer.isBuffer(value)) value = value.toString('utf8');
    if (typeof value === 'string') {
      if (Buffer.byteLength(value, 'utf8') > maxBytes) throw new Error('The selected photo is too large. Choose a smaller image.');
      try { return value ? JSON.parse(value) : {}; }
      catch (_) { throw new Error('Invalid JSON body.'); }
    }
    if (typeof value === 'object') {
      if (Buffer.byteLength(JSON.stringify(value), 'utf8') > maxBytes) throw new Error('The selected photo is too large. Choose a smaller image.');
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
        reject(new Error('The selected photo is too large. Choose a smaller image.'));
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
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseJson(value, fallback = {}) {
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

async function readAd(id) {
  const { url, key } = supabaseAdminConfig();
  const params = new URLSearchParams({ select: '*', id: `eq.${id}`, limit: '1' });
  const response = await fetch(`${url}/rest/v1/ads?${params.toString()}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }
  });
  const data = await response.json().catch(() => []);
  if (!response.ok) throw new Error(data.message || data.details || 'Could not load the ad.');
  return Array.isArray(data) ? data[0] : null;
}

function ownsAd(ad, userId) {
  const custom = parseJson(ad?.custom_fields, {});
  return [
    ad?.user_id,
    ad?.owner_id,
    ad?.seller_id,
    ad?.profile_id,
    ad?.created_by,
    custom.owner_user_id
  ].some((value) => String(value || '') === String(userId));
}

async function resolveCityId(districtName, cityName, currentCityId) {
  const { url, key } = supabaseAdminConfig();
  const headers = { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' };
  try {
    const [districtResponse, cityResponse] = await Promise.all([
      fetch(`${url}/rest/v1/districts?select=id,name,slug&limit=100`, { headers }),
      fetch(`${url}/rest/v1/cities?select=id,name,district_id&limit=1000`, { headers })
    ]);
    if (!districtResponse.ok || !cityResponse.ok) return currentCityId;
    const districts = await districtResponse.json().catch(() => []);
    const cities = await cityResponse.json().catch(() => []);
    const district = (Array.isArray(districts) ? districts : []).find((row) =>
      [row.name, row.slug, row.id].some((value) => slug(value) === slug(districtName))
    );
    const city = (Array.isArray(cities) ? cities : []).find((row) =>
      slug(row.name) === slug(cityName) && (!district || String(row.district_id) === String(district.id))
    ) || (Array.isArray(cities) ? cities : []).find((row) => slug(row.name) === slug(cityName));
    return city?.id || currentCityId;
  } catch (_) {
    return currentCityId;
  }
}

function validateImage(value) {
  const image = String(value || '');
  if (!image) return '';
  if (!/^data:image\/(?:jpeg|jpg|png|webp);base64,/i.test(image)) {
    throw new Error('The replacement photo format is not supported.');
  }
  if (Buffer.byteLength(image, 'utf8') > 4.2 * 1024 * 1024) {
    throw new Error('The replacement photo is too large. Choose a smaller image.');
  }
  return image;
}

function validateImages(values) {
  if (!Array.isArray(values)) return [];
  const images = values.map(validateImage).filter(Boolean).slice(0, 10);
  if (images.length > 10) throw new Error('You can upload up to 10 photos.');
  return images;
}

async function updateAd(id, payload) {
  const { url, key } = supabaseAdminConfig();
  const params = new URLSearchParams({ id: `eq.${id}` });
  const response = await fetch(`${url}/rest/v1/ads?${params.toString()}`, {
    method: 'PATCH',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(payload)
  });
  const raw = await response.text();
  let data = [];
  try { data = raw ? JSON.parse(raw) : []; }
  catch (_) { data = { message: raw }; }
  if (!response.ok) {
    throw new Error(data.message || data.details || data.hint || 'Could not update the ad.');
  }
  return Array.isArray(data) ? data[0] : data;
}

module.exports = async function handler(req, res) {
  if (!['POST', 'PATCH'].includes(req.method)) {
    return json(res, 405, { ok: false, message: 'Method not allowed' });
  }

  try {
    const user = await authenticatedUser(req);
    const body = await readLargeBody(req);
    const id = String(body.id || '').trim();
    const title = String(body.title || '').trim();
    const description = String(body.description || '').trim();
    const district = String(body.district || '').trim();
    const city = String(body.city || '').trim();
    const condition = String(body.condition || '').trim().toLowerCase();
    const price = Number(String(body.price ?? '').replace(/[^\d.]/g, ''));

    if (!id || id.length > 100 || !/^[a-zA-Z0-9._:-]+$/.test(id)) {
      throw new Error('Invalid ad ID.');
    }
    if (title.length < 3 || title.length > 160) throw new Error('Enter a valid ad title.');
    if (description.length < 5 || description.length > 10000) throw new Error('Enter a complete description.');
    if (!Number.isFinite(price) || price < 0) throw new Error('Enter a valid price.');
    if (!district || district.length > 100) throw new Error('Select a valid district.');
    if (!city || city.length > 120) throw new Error('Select a valid city or town.');
    if (condition.length > 40) throw new Error('Invalid item condition.');

    const existing = await readAd(id);
    if (!existing) return json(res, 404, { ok: false, message: 'Ad not found.' });
    if (!ownsAd(existing, user.id)) {
      return json(res, 403, { ok: false, message: 'You can edit only your own ads.' });
    }

    const now = new Date().toISOString();
    const custom = parseJson(existing.custom_fields, {});
    const replacementImages = validateImages(body.images);
    const replacementImage = replacementImages[0] || validateImage(body.image);
    let images = parseJson(existing.images, []);
    if (!Array.isArray(images)) images = [];
    images = images.filter(Boolean);

    const effectiveImageCount = Math.max(
      Number(custom.image_count || custom.images_count || 0) || 0,
      images.length,
      existing.image_url ? 1 : 0
    );

    const payload = {
      title,
      description,
      price,
      condition: condition || null,
      status: 'pending',
      reject_reason: null,
      city_id: await resolveCityId(district, city, existing.city_id),
      custom_fields: {
        ...custom,
        district,
        city,
        owner_user_id: user.id,
        user_edited_at: now,
        previous_status_before_edit: existing.status || 'pending',
        requires_admin_review: true,
        image_count: replacementImages.length
          ? replacementImages.length
          : (replacementImage ? Math.max(1, effectiveImageCount) : effectiveImageCount)
      },
      updated_at: now
    };

    if (replacementImages.length) {
      payload.image_url = replacementImages[0];
      payload.images = replacementImages;
    } else if (replacementImage) {
      payload.image_url = replacementImage;
      payload.images = [replacementImage, ...images.slice(1, 10)];
    }

    const ad = await updateAd(id, payload);
    return json(res, 200, {
      ok: true,
      message: 'Changes saved. The ad is pending admin approval.',
      ad: { ...ad, status: 'pending', updated_at: ad?.updated_at || now }
    });
  } catch (error) {
    const auth = error.message === 'AUTH_REQUIRED';
    return json(res, auth ? 401 : 400, {
      ok: false,
      message: auth ? 'Log in to edit your ad.' : (error.message || 'Could not update the ad.')
    });
  }
};
