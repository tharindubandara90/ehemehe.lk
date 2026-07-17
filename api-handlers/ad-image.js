const { config, rest, parseJson } = require('../lib/public-ads-utils');

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
  res.end(JSON.stringify(body));
}

function dataUrl(value) {
  const match = String(value || '').match(/^data:([^;,]+);base64,(.+)$/s);
  if (!match) return null;
  return { mime: match[1], buffer: Buffer.from(match[2], 'base64') };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return sendJson(res, 405, { ok: false, message: 'Method not allowed' });
  }
  try {
    const url = new URL(req.url, 'http://localhost');
    const id = String(url.searchParams.get('id') || '').trim();
    const index = Math.max(0, Math.min(Number(url.searchParams.get('index')) || 0, 9));
    if (!id || id.length > 100 || !/^[a-zA-Z0-9._:-]+$/.test(id)) {
      return sendJson(res, 400, { ok: false, message: 'Invalid ad ID.' });
    }

    const params = new URLSearchParams({ select: 'image_url,images', id: `eq.${id}`, limit: '1' });
    const rows = await rest(`/rest/v1/ads?${params.toString()}`, {}, 8000);
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return sendJson(res, 404, { ok: false, message: 'Image not found.' });

    const images = parseJson(row.images, []);
    const value = (Array.isArray(images) && images[index]) || (index === 0 ? row.image_url : '') || '';
    if (!value) return sendJson(res, 404, { ok: false, message: 'Image not found.' });

    const inline = dataUrl(value);
    if (inline) {
      res.statusCode = 200;
      res.setHeader('Content-Type', inline.mime || 'image/jpeg');
      res.setHeader('Content-Length', String(inline.buffer.length));
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, immutable');
      if (req.method === 'HEAD') return res.end();
      return res.end(inline.buffer);
    }

    if (/^https?:\/\//i.test(value)) {
      res.statusCode = 302;
      res.setHeader('Location', value);
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
      return res.end();
    }

    return sendJson(res, 404, { ok: false, message: 'Unsupported image format.' });
  } catch (error) {
    return sendJson(res, 502, { ok: false, message: error.message || 'Could not load the image.' });
  }
};
