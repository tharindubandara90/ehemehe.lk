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

async function ensurePublicBucket(url, key) {
  const existing = await fetch(`${url}/storage/v1/bucket/${BUCKET}`, {
    headers: adminHeaders(key, { Accept: 'application/json' })
  });
  if (existing.ok) {
    const bucket = await existing.json().catch(() => ({}));
    if (bucket.public === true) return;

    const updated = await fetch(`${url}/storage/v1/bucket/${BUCKET}`, {
      method: 'PUT',
      headers: adminHeaders(key, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        public: true,
        file_size_limit: 524288,
        allowed_mime_types: ['image/webp', 'image/jpeg', 'image/png']
      })
    });
    if (!updated.ok) {
      const details = await updated.json().catch(() => ({}));
      throw new Error(details.message || details.error || 'Could not configure profile image storage.');
    }
    return;
  }

  if (existing.status !== 404) {
    const details = await existing.json().catch(() => ({}));
    throw new Error(details.message || details.error || 'Could not access profile image storage.');
  }

  const created = await fetch(`${url}/storage/v1/bucket`, {
    method: 'POST',
    headers: adminHeaders(key, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      id: BUCKET,
      name: BUCKET,
      public: true,
      file_size_limit: 524288,
      allowed_mime_types: ['image/webp', 'image/jpeg', 'image/png']
    })
  });
  if (!created.ok && created.status !== 409) {
    const details = await created.json().catch(() => ({}));
    throw new Error(details.message || details.error || 'Could not create profile image storage.');
  }
}

async function uploadAvatar(url, key, userId, image) {
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
  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(details.message || details.error || 'Could not upload profile picture.');
  }

  return `${url}/storage/v1/object/public/${BUCKET}/${objectPath}?v=${Date.now()}`;
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
    return json(res, 200, { ok: true, avatarUrl });
  } catch (error) {
    const auth = error.message === 'AUTH_REQUIRED';
    return json(res, auth ? 401 : 400, {
      ok: false,
      message: auth ? 'Log in to change your profile picture.' : (error.message || 'Could not update profile picture.')
    });
  }
};
