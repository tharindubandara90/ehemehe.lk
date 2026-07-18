const zlib = require('zlib');
const sharp = require('sharp');
const { supabaseAdminConfig, supabasePublicKey } = require('./_otp-utils');

const HOME_CACHE = 'public, max-age=30, s-maxage=120, stale-while-revalidate=600';
const LIST_SELECT = [
  'id','title','description','price','currency','phone','condition','status',
  'category_id','city_id','custom_fields','is_featured','is_promoted',
  'promotion_type','view_count','finance_enabled','finance_downpayment',
  'finance_monthly_payment','finance_company_phone','created_at','updated_at'
].join(',');
const FIRST_IMAGE_SELECT = 'id,image_url,created_at,updated_at';

function sendJsonBody(req, res, body) {
  if (req.method === 'HEAD') return res.end();
  const input = Buffer.from(body, 'utf8');
  const accept = String(req.headers['accept-encoding'] || '');
  if (/\bbr\b/.test(accept)) {
    const output = zlib.brotliCompressSync(input, {
      params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 }
    });
    res.setHeader('Content-Encoding', 'br');
    res.setHeader('Content-Length', String(output.length));
    return res.end(output);
  }
  if (/\bgzip\b/.test(accept)) {
    const output = zlib.gzipSync(input, { level: 6 });
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Content-Length', String(output.length));
    return res.end(output);
  }
  res.setHeader('Content-Length', String(input.length));
  return res.end(input);
}

function projectConfig() {
  try {
    return supabaseAdminConfig();
  } catch (_) {
    const url = String(process.env.SUPABASE_URL || 'https://ieymsjeywkapqeniirlm.supabase.co').replace(/\/$/, '');
    return { url, key: supabasePublicKey() };
  }
}

async function rest(table, params, key, url) {
  const query = new URLSearchParams(params);
  const response = await fetch(`${url}/rest/v1/${table}?${query.toString()}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json'
    }
  });
  if (!response.ok) return [];
  const data = await response.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

function imageRoute(row) {
  const version = encodeURIComponent(String(row.updated_at || row.created_at || '1'));
  return `/api/public-ad-image?id=${encodeURIComponent(String(row.id))}&v=${version}`;
}

function parseDataImage(value) {
  const match = String(value || '').match(/^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i);
  if (!match) return null;
  try {
    return { mime: match[1].toLowerCase(), buffer: Buffer.from(match[2].replace(/\s+/g, ''), 'base64') };
  } catch (_) {
    return null;
  }
}

async function prepareFirstPaintImage(row) {
  const value = String(row?.image_url || '').trim();
  if (!value) return '';

  // New ads already store a small 480px WebP thumbnail in image_url. Reuse it
  // directly so the first card image is delivered in the same JSON response
  // and is not hidden behind a second client-side API dependency.
  const parsed = parseDataImage(value);
  if (parsed) {
    if (parsed.mime === 'image/webp' && parsed.buffer.length <= 180 * 1024) return value;
    try {
      const output = await sharp(parsed.buffer, { failOn: 'none' })
        .rotate()
        .resize(480, 360, { fit: 'cover', position: 'centre', withoutEnlargement: false })
        .webp({ quality: 68, effort: 4 })
        .toBuffer();
      return `data:image/webp;base64,${output.toString('base64')}`;
    } catch (_) {
      return '';
    }
  }

  // Remote image URLs can be requested by the browser immediately after the
  // single home JSON response without another Supabase/schema lookup.
  if (/^https?:\/\//i.test(value) || value.startsWith('/')) return value;
  return '';
}

module.exports = async function publicHome(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ ok: false, message: 'Method not allowed' }));
  }

  try {
    const { url, key } = projectConfig();
    // The browser makes one critical request. Inside that request the compact
    // listing data and only the newest thumbnail are fetched in parallel. This
    // removes the old client dependency chain: home JSON -> image API ->
    // Supabase -> image conversion. Filters, promotions and finance settings
    // remain deferred to /api/public-meta.
    const [ads, firstImageRows] = await Promise.all([
      rest('ads', {
        select: LIST_SELECT,
        status: 'eq.approved',
        order: 'created_at.desc',
        limit: '60'
      }, key, url),
      rest('ads', {
        select: FIRST_IMAGE_SELECT,
        status: 'eq.approved',
        order: 'created_at.desc',
        limit: '1'
      }, key, url)
    ]);

    const firstImageRow = firstImageRows[0] || null;
    const firstPaintImage = firstImageRow ? await prepareFirstPaintImage(firstImageRow) : '';
    const safeAds = ads.map((row, index) => ({
      ...row,
      image_url: index === 0 && firstImageRow && String(firstImageRow.id) === String(row.id) && firstPaintImage
        ? firstPaintImage
        : imageRoute(row),
      images: []
    }));

    const body = JSON.stringify({
      ok: true,
      generatedAt: new Date().toISOString(),
      ads: safeAds
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', HOME_CACHE);
    res.setHeader('CDN-Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
    res.setHeader('Vary', 'Accept-Encoding');
    return sendJsonBody(req, res, body);
  } catch (error) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.end(JSON.stringify({ ok: false, message: 'Could not load marketplace data.' }));
  }
};
