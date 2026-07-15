const { json } = require('./_otp-utils');
const { queryAds, normalizeAd } = require('./_public-ads-utils');

let cache = { expiresAt: 0, rows: [] };

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, message: 'Method not allowed' });
  try {
    const url = new URL(req.url, 'http://localhost');
    const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit')) || 60, 120));
    const now = Date.now();
    let rows;
    if (cache.expiresAt > now && cache.rows.length >= Math.min(limit, cache.rows.length)) {
      rows = cache.rows.slice(0, limit);
    } else {
      rows = await queryAds({ limit, approvedOnly: true });
      cache = { expiresAt: now + 30_000, rows };
    }
    res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=30, stale-while-revalidate=120');
    return json(res, 200, { ok: true, ads: rows.map((row) => normalizeAd(row, false)) });
  } catch (error) {
    return json(res, 502, { ok: false, message: error.message || 'Could not load ads.', ads: [] });
  }
};
