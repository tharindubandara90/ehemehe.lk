'use strict';
const { json, supabasePublicKey, supabaseAdminConfig } = require('../lib/otp-utils');

function readBody(req, maxBytes = 64 * 1024) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') return Promise.resolve(req.body);
    try { return Promise.resolve(JSON.parse(String(req.body || '{}'))); }
    catch (_) { return Promise.reject(new Error('Invalid request body.')); }
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) return reject(new Error('Request is too large.'));
      chunks.push(chunk);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch (_) { reject(new Error('Invalid request body.')); }
    });
    req.on('error', reject);
  });
}

function normalizePhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0094')) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 10) digits = `94${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith('7')) digits = `94${digits}`;
  if (!/^947\d{8}$/.test(digits)) throw new Error('Enter a valid Sri Lankan mobile number.');
  return `+${digits}`;
}

async function authenticatedUser(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) throw new Error('AUTH_REQUIRED');
  const { url } = supabaseAdminConfig();
  const publicKey = supabasePublicKey();
  const response = await fetch(`${url}/auth/v1/user`, { headers: { apikey: publicKey, Authorization: `Bearer ${token}` } });
  const user = await response.json().catch(() => ({}));
  if (!response.ok || !user.id) throw new Error('AUTH_REQUIRED');
  return user;
}

module.exports = async function handler(req, res) {
  if (!['POST', 'PATCH'].includes(req.method)) return json(res, 405, { ok: false, message: 'Method not allowed' });
  try {
    const user = await authenticatedUser(req);
    const body = await readBody(req);
    const name = String(body.name || '').trim().replace(/\s+/g, ' ');
    const email = String(body.email || '').trim().toLowerCase();
    const phone = normalizePhone(body.phone);
    if (name.length < 2 || name.length > 100) throw new Error('Enter your full name.');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');

    const { url, key } = supabaseAdminConfig();
    const metadata = {
      ...(user.user_metadata || {}),
      name,
      full_name: name,
      contact_email: email,
      phone,
      profile_updated_at: new Date().toISOString()
    };
    const response = await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(user.id)}`, {
      method: 'PUT',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_metadata: metadata })
    });
    const updated = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(updated.message || updated.error_description || 'Could not save profile changes.');
    return json(res, 200, { ok: true, message: 'Profile changes saved.', user: {
      id: user.id, name, email, phone, avatarUrl: metadata.avatar_url || ''
    }, userMetadata: metadata });
  } catch (error) {
    const auth = error.message === 'AUTH_REQUIRED';
    return json(res, auth ? 401 : 400, { ok: false, message: auth ? 'Log in to update your profile.' : (error.message || 'Could not save profile changes.') });
  }
};
