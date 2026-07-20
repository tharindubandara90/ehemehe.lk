const { json } = require('../lib/otp-utils');
const { queryAds, normalizeAd } = require('../lib/public-ads-utils');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, message: 'Method not allowed' });
  try {
    const url = new URL(req.url, 'http://localhost');
    const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit')) || 60, 120));
    const rows = await queryAds({ limit, approvedOnly: true });
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('CDN-Cache-Control', 'no-store');
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
    return json(res, 200, { ok: true, generatedAt: new Date().toISOString(), ads: rows.map((row) => normalizeAd(row, false)) });
  } catch (error) {
    res.setHeader('Cache-Control', 'no-store');
    return json(res, 502, { ok: false, message: error.message || 'Could not load ads.', ads: [] });
  }
};
