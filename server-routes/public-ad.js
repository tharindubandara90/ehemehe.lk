const { supabaseAdminConfig, supabasePublicKey } = require('./_otp-utils');

function projectConfig() {
  try {
    return supabaseAdminConfig();
  } catch (_) {
    const url = String(process.env.SUPABASE_URL || 'https://ieymsjeywkapqeniirlm.supabase.co').replace(/\/$/, '');
    return { url, key: supabasePublicKey() };
  }
}

module.exports = async function publicAd(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    return res.end();
  }

  const requestUrl = new URL(req.url, 'http://localhost');
  const id = String(requestUrl.searchParams.get('id') || '').trim();
  if (!/^[a-zA-Z0-9-]{6,80}$/.test(id)) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.end(JSON.stringify({ ok: false, message: 'Invalid ad ID.' }));
  }

  try {
    const { url, key } = projectConfig();
    const query = new URLSearchParams({ select: '*', id: `eq.${id}`, status: 'eq.approved', limit: '1' });
    const response = await fetch(`${url}/rest/v1/ads?${query.toString()}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }
    });
    const rows = await response.json().catch(() => []);
    const ad = Array.isArray(rows) ? rows[0] : null;
    if (!response.ok || !ad) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=30');
      return res.end(JSON.stringify({ ok: false, message: 'Ad not found.' }));
    }

    const body = JSON.stringify({ ok: true, ad });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=120, stale-while-revalidate=600');
    if (req.method === 'HEAD') return res.end();
    return res.end(body);
  } catch (_) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.end(JSON.stringify({ ok: false, message: 'Could not load this ad.' }));
  }
};
