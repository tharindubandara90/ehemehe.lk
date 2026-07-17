'use strict';

const { json, supabasePublicKey, supabaseAdminConfig } = require('../lib/otp-utils');

const BUCKET = 'profile-images';
const MAX_BODY_BYTES = 350 * 1024;
const MAX_IMAGE_BYTES = 180 * 1024;

function readJsonBody(req) {
  const parse = (value) => {
    if (value === undefined || value === null || value === '') return {};
    if (Buffer.isBuffer(value)) value = value.toString('utf8');
    if (typeof value === 'object') {
      const serialized = JSON.stringify(value);
      if (Buffer.byteLength(serialized, 'utf8') > MAX_BODY_BYTES) throw new Error('Profile picture is too large.');
      return value;
    }
    if (typeof value === 'string') {
      if (Buffer.byteLength(value, 'utf8') > MAX_BODY_BYTES) throw new Error('Profile picture is too large.');
      try { return JSON.parse(value); }
      catch (_) { throw new Error('Invalid request body.'); }
    }
    throw new Error('Invalid request body.');
  };

  if (req.body !== undefined && req.body !== null) return Promise.resolve(parse(req.body));

  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Profile picture is too large.'));
        req.destroy?.();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try { resolve(parse(Buffer.concat(chunks).toString('utf8'))); }
      catch (error) { reject(error); }
    });
    req.on('error', reject);
  });
}

async function responsePayload(response) {
  const raw = await response.text().catch(() => '');
  if (!raw) return {};
  try { return JSON.parse(raw); }
  catch (_) { return { message: raw }; }
}

function storageMessage(payload) {
  return String(
    payload?.message ||
    payload?.error ||
    payload?.error_description ||
    payload?.code ||
    ''
  ).trim();
}

function isBucketMissing(response, payload) {
  const code = String(payload?.statusCode || payload?.status || payload?.code || '');
  const message = storageMessage(payload);
  return response?.status === 404 || code === '404' || /bucket\s+not\s+found/i.test(message);
}

function isBucketAlreadyPresent(response, payload) {
  const code = String(payload?.statusCode || payload?.status || payload?.code || '');
  const message = storageMessage(payload);
  return response?.status === 409 || code === '409' || /already exists|duplicate/i.test(message);
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

function parseImageData(value) {
  const match = String(value || '').match(/^data:image\/(webp|jpeg|jpg|png);base64,([a-z0-9+/=]+)$/i);
  if (!match) throw new Error('Unsupported profile picture format.');

  const subtype = match[1].toLowerCase() === 'jpg' ? 'jpeg' : match[1].toLowerCase();
  const mime = `image/${subtype}`;
  const extension = subtype === 'jpeg' ? 'jpg' : subtype;
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new Error('Profile picture is too large.');
  return { bytes, mime, extension };
}

function adminHeaders(key, extra = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...extra
  };
}

function bucketOptions() {
  return {
    public: true,
    file_size_limit: 524288,
    allowed_mime_types: ['image/webp', 'image/jpeg', 'image/png']
  };
}

async function readBucket(url, key) {
  const response = await fetch(`${url}/storage/v1/bucket/${encodeURIComponent(BUCKET)}`, {
    headers: adminHeaders(key, { Accept: 'application/json' })
  });
  const payload = await responsePayload(response);
  return { response, payload };
}

async function waitForBucket(url, key) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const result = await readBucket(url, key);
    if (result.response.ok) return result.payload;
    if (!isBucketMissing(result.response, result.payload)) {
      throw new Error(storageMessage(result.payload) || 'Could not access profile image storage.');
    }
    if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, 120 * (attempt + 1)));
  }
  throw new Error('Profile image storage could not be initialized.');
}

async function ensurePublicBucket(url, key) {
  const existing = await readBucket(url, key);
  if (existing.response.ok) {
    if (existing.payload.public === true) return;

    const updated = await fetch(`${url}/storage/v1/bucket/${encodeURIComponent(BUCKET)}`, {
      method: 'PUT',
      headers: adminHeaders(key, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(bucketOptions())
    });
    const updatePayload = await responsePayload(updated);
    if (!updated.ok) {
      throw new Error(storageMessage(updatePayload) || 'Could not configure profile image storage.');
    }
    return;
  }

  // Supabase Storage may report a missing bucket as HTTP 400 while the JSON
  // body contains statusCode/code 404 and "Bucket not found". Treat all of
  // those forms as the same missing-bucket condition and create it.
  if (!isBucketMissing(existing.response, existing.payload)) {
    throw new Error(storageMessage(existing.payload) || 'Could not access profile image storage.');
  }

  const created = await fetch(`${url}/storage/v1/bucket`, {
    method: 'POST',
    headers: adminHeaders(key, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ id: BUCKET, name: BUCKET, ...bucketOptions() })
  });
  const createPayload = await responsePayload(created);
  if (!created.ok && !isBucketAlreadyPresent(created, createPayload)) {
    throw new Error(storageMessage(createPayload) || 'Could not create profile image storage.');
  }

  await waitForBucket(url, key);
}

async function uploadAvatarOnce(url, key, userId, image) {
  const objectPath = `${encodeURIComponent(userId)}/avatar.${image.extension}`;
  const response = await fetch(`${url}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: 'POST',
    headers: adminHeaders(key, {
      'Content-Type': image.mime,
      'Cache-Control': '3600',
      'x-upsert': 'true'
    }),
    body: image.bytes
  });
  const payload = await responsePayload(response);
  return { response, payload, objectPath };
}

async function uploadAvatar(url, key, userId, image) {
  let result = await uploadAvatarOnce(url, key, userId, image);
  if (!result.response.ok && isBucketMissing(result.response, result.payload)) {
    await ensurePublicBucket(url, key);
    result = await uploadAvatarOnce(url, key, userId, image);
  }
  if (!result.response.ok) {
    throw new Error(storageMessage(result.payload) || 'Could not upload profile picture.');
  }

  return `${url}/storage/v1/object/public/${BUCKET}/${result.objectPath}?v=${Date.now()}`;
}

async function saveAvatarMetadata(url, key, user, avatarUrl) {
  const userMetadata = {
    ...(user.user_metadata || {}),
    avatar_url: avatarUrl,
    avatar_updated_at: new Date().toISOString()
  };

  const response = await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(user.id)}`, {
    method: 'PUT',
    headers: adminHeaders(key, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ user_metadata: userMetadata })
  });
  const payload = await responsePayload(response);
  if (!response.ok) {
    throw new Error(storageMessage(payload) || 'The profile photo was uploaded but could not be saved to the account.');
  }
  return payload?.user_metadata || userMetadata;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, message: 'Method not allowed' });

  try {
    const user = await authenticatedUser(req);
    const body = await readJsonBody(req);
    const image = parseImageData(body.imageData);
    const { url, key } = supabaseAdminConfig();

    await ensurePublicBucket(url, key);
    const avatarUrl = await uploadAvatar(url, key, user.id, image);
    const userMetadata = await saveAvatarMetadata(url, key, user, avatarUrl);
    return json(res, 200, { ok: true, avatarUrl, userMetadata });
  } catch (error) {
    const auth = error.message === 'AUTH_REQUIRED';
    console.error('Profile photo API failed:', error);
    return json(res, auth ? 401 : 400, {
      ok: false,
      message: auth ? 'Log in to change your profile picture.' : (error.message || 'Could not update profile picture.')
    });
  }
};
