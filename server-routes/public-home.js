const zlib = require('zlib');
const sharp = require('sharp');
const { supabaseAdminConfig, supabasePublicKey } = require('./_otp-utils');

const HOME_CACHE = 'public, max-age=15, s-maxage=45, stale-while-revalidate=180';
const PUBLIC_STATUSES = new Set(['approved', 'active', 'published']);

// Preferred list projection. It deliberately excludes image_url and images so
// home/list pages never download the complete Base64 photo payload.
const LIST_SELECT = [
  'id','title','description','price','currency','phone','condition','status',
  'category_id','city_id','custom_fields','is_featured','is_promoted',
  'promotion_type','view_count','finance_enabled','finance_downpayment',
  'finance_monthly_payment','finance_company_phone','created_at','updated_at'
].join(',');

// Some older EheMehe databases were created before optional promotion/finance
// columns existed. A missing optional column makes PostgREST reject the entire
// preferred select. This reduced projection keeps real ads visible without
// falling back to the huge `select=*` response.
const CORE_LIST_SELECT = [
  'id','title','description','price','currency','phone','condition','status',
  'category_id','city_id','custom_fields','created_at','updated_at'
].join(',');

const FIRST_IMAGE_SELECT = 'id,image_url,created_at,updated_at';
const PUBLIC_STATUS_FILTER = 'in.(approved,active,published)';

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

async function restResult(table, params, key, url) {
  const query = new URLSearchParams(params);
  try {
    const response = await fetch(`${url}/rest/v1/${table}?${query.toString()}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json'
      }
    });
    const payload = await response.json().catch(() => []);
    return {
      ok: response.ok,
      rows: response.ok && Array.isArray(payload) ? payload : [],
      status: response.status || 0,
      error: response.ok ? '' : String(payload?.message || payload?.hint || payload?.details || '')
    };
  } catch (error) {
    return { ok: false, rows: [], status: 0, error: String(error?.message || error || '') };
  }
}

function isPublicRow(row) {
  return PUBLIC_STATUSES.has(String(row?.status || '').trim().toLowerCase());
}

async function loadCompactAds(key, url) {
  const common = {
    status: PUBLIC_STATUS_FILTER,
    order: 'created_at.desc',
    limit: '60'
  };

  const preferred = await restResult('ads', { select: LIST_SELECT, ...common }, key, url);
  if (preferred.ok && preferred.rows.length) return preferred.rows;

  // Schema-compatible fallback for installations where one optional preferred
  // column has not yet been added. This was the reason the independent desktop
  // shell showed “0 listings found” even while the previous site showed ads.
  if (!preferred.ok) {
    const core = await restResult('ads', { select: CORE_LIST_SELECT, ...common }, key, url);
    if (core.ok && core.rows.length) return core.rows;
  }

  // Compatibility for legacy rows whose public status used different casing or
  // the older `active`/`published` values. Fetch only compact text metadata and
  // filter on the server; pending/rejected rows are never returned to clients.
  const legacy = await restResult('ads', {
    select: CORE_LIST_SELECT,
    order: 'created_at.desc',
    limit: '120'
  }, key, url);
  if (!legacy.ok) return [];
  return legacy.rows.filter(isPublicRow).slice(0, 60);
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

  if (/^https?:\/\//i.test(value) || value.startsWith('/')) return value;
  return '';
}

async function loadFirstImageRows(key, url) {
  const result = await restResult('ads', {
    select: FIRST_IMAGE_SELECT,
    status: PUBLIC_STATUS_FILTER,
    order: 'created_at.desc',
    limit: '1'
  }, key, url);
  return result.ok ? result.rows : [];
}

async function loadFirstImageById(id, key, url) {
  if (!id) return null;
  const result = await restResult('ads', {
    select: FIRST_IMAGE_SELECT,
    id: `eq.${id}`,
    limit: '1'
  }, key, url);
  return result.ok ? result.rows[0] || null : null;
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

    // Keep the normal LCP path at two parallel compact requests. Compatibility
    // retries happen only when the live schema rejects/empties the preferred
    // query; they do not penalize healthy deployments.
    const [ads, firstImageRows] = await Promise.all([
      loadCompactAds(key, url),
      loadFirstImageRows(key, url)
    ]);

    let firstImageRow = firstImageRows[0] || null;
    if ((!firstImageRow || String(firstImageRow.id) !== String(ads[0]?.id || '')) && ads[0]?.id) {
      firstImageRow = await loadFirstImageById(ads[0].id, key, url);
    }

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
    res.setHeader('CDN-Cache-Control', 'public, s-maxage=45, stale-while-revalidate=180');
    res.setHeader('Vary', 'Accept-Encoding');
    return sendJsonBody(req, res, body);
  } catch (error) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.end(JSON.stringify({ ok: false, message: 'Could not load marketplace data.' }));
  }
};
