const zlib = require('zlib');
const { supabaseAdminConfig, supabasePublicKey } = require('./_otp-utils');

const META_CACHE = 'public, max-age=120, s-maxage=600, stale-while-revalidate=3600';

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

module.exports = async function publicMeta(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ ok: false, message: 'Method not allowed' }));
  }

  try {
    const { url, key } = projectConfig();
    const [settings, promotions, banners, categories, districts, cities] = await Promise.all([
      rest('site_settings', { select: 'key,value', limit: '100' }, key, url),
      rest('ad_promotions', { select: '*', order: 'created_at.desc', limit: '100' }, key, url),
      rest('banner_ads', { select: '*', order: 'created_at.desc', limit: '50' }, key, url),
      rest('categories', { select: 'id,name,slug,parent_id,is_active', is_active: 'eq.true', order: 'name.asc', limit: '500' }, key, url),
      rest('districts', { select: 'id,name,slug,is_active', is_active: 'eq.true', order: 'name.asc', limit: '100' }, key, url),
      rest('cities', { select: 'id,name,district_id,is_active', is_active: 'eq.true', order: 'name.asc', limit: '1000' }, key, url)
    ]);

    const body = JSON.stringify({ ok: true, settings, promotions, banners, categories, districts, cities });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', META_CACHE);
    res.setHeader('CDN-Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
    res.setHeader('Vary', 'Accept-Encoding');
    return sendJsonBody(req, res, body);
  } catch (_) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.end(JSON.stringify({ ok: false, message: 'Could not load marketplace filters.' }));
  }
};
