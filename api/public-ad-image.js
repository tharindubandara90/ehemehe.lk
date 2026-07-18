const crypto = require('crypto');
const sharp = require('sharp');
const { supabaseAdminConfig, supabasePublicKey } = require('./_otp-utils');

const PLACEHOLDER = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360"><rect width="480" height="360" fill="#eef7f3"/><path d="M180 225l50-58 38 42 30-31 48 47H180z" fill="#b6dfd1"/><circle cx="190" cy="135" r="24" fill="#8fd0b9"/><text x="240" y="292" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" fill="#4b7d6c">EheMehe</text></svg>`,
  'utf8'
);

function projectConfig() {
  try {
    return supabaseAdminConfig();
  } catch (_) {
    const url = String(process.env.SUPABASE_URL || 'https://ieymsjeywkapqeniirlm.supabase.co').replace(/\/$/, '');
    return { url, key: supabasePublicKey() };
  }
}

function sendImage(req, res, buffer, contentType, cache = true) {
  const etag = `"${crypto.createHash('sha1').update(buffer).digest('hex')}"`;
  if (req.headers['if-none-match'] === etag) {
    res.statusCode = 304;
    res.setHeader('ETag', etag);
    return res.end();
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', contentType || 'image/jpeg');
  res.setHeader('Content-Length', String(buffer.length));
  res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', cache
    ? 'public, max-age=31536000, immutable, s-maxage=31536000'
    : 'public, max-age=3600, s-maxage=86400');
  if (req.method === 'HEAD') return res.end();
  return res.end(buffer);
}


async function optimizeListImage(buffer) {
  try {
    return await sharp(buffer, { limitInputPixels: 40000000, failOn: 'none' })
      .rotate()
      .resize(480, 360, { fit: 'cover', position: 'centre', withoutEnlargement: false })
      .webp({ quality: 68, effort: 3, smartSubsample: true })
      .toBuffer();
  } catch (_) {
    return null;
  }
}

async function sendOptimizedImage(req, res, buffer, fallbackType) {
  const optimized = await optimizeListImage(buffer);
  if (optimized) return sendImage(req, res, optimized, 'image/webp', true);
  return sendImage(req, res, buffer, fallbackType || 'image/jpeg', true);
}

function parseDataUrl(value) {
  const match = String(value || '').match(/^data:([^;,]+);base64,(.+)$/s);
  if (!match) return null;
  try {
    return { type: match[1], buffer: Buffer.from(match[2], 'base64') };
  } catch (_) {
    return null;
  }
}

module.exports = async function publicAdImage(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    return res.end();
  }

  const requestUrl = new URL(req.url, 'http://localhost');
  const id = String(requestUrl.searchParams.get('id') || '').trim();
  if (!/^[a-zA-Z0-9-]{6,80}$/.test(id)) {
    return sendImage(req, res, PLACEHOLDER, 'image/svg+xml; charset=utf-8', false);
  }

  try {
    const { url, key } = projectConfig();
    // The list-image path must not download the complete multi-photo Base64
    // array. Read the dedicated thumbnail/image_url first and touch `images`
    // only as a compatibility fallback for old rows.
    const query = new URLSearchParams({ select: 'image_url,status', id: `eq.${id}`, status: 'eq.approved', limit: '1' });
    const response = await fetch(`${url}/rest/v1/ads?${query.toString()}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }
    });
    const rows = await response.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] : null;
    let source = String(row?.image_url || '');

    if (!source && row) {
      const legacyQuery = new URLSearchParams({ select: 'images', id: `eq.${id}`, status: 'eq.approved', limit: '1' });
      const legacyResponse = await fetch(`${url}/rest/v1/ads?${legacyQuery.toString()}`, {
        headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }
      });
      const legacyRows = await legacyResponse.json().catch(() => []);
      let images = Array.isArray(legacyRows) ? legacyRows[0]?.images : [];
      if (typeof images === 'string') {
        try { images = JSON.parse(images); } catch (_) { images = []; }
      }
      source = String(Array.isArray(images) ? images[0] || '' : '');
    }
    if (!source) return sendImage(req, res, PLACEHOLDER, 'image/svg+xml; charset=utf-8', false);

    const inline = parseDataUrl(source);
    if (inline) return sendOptimizedImage(req, res, inline.buffer, inline.type);

    if (/^https?:\/\//i.test(source)) {
      const remote = await fetch(source, { headers: { Accept: 'image/avif,image/webp,image/*,*/*;q=0.8' } });
      if (remote.ok) {
        const buffer = Buffer.from(await remote.arrayBuffer());
        const type = remote.headers.get('content-type') || 'image/jpeg';
        return sendOptimizedImage(req, res, buffer, type);
      }
    }
  } catch (_) {}

  return sendImage(req, res, PLACEHOLDER, 'image/svg+xml; charset=utf-8', false);
};
