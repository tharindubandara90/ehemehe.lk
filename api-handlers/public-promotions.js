const { json } = require('../lib/otp-utils');
const { rest } = require('../lib/public-ads-utils');

let cache = { expiresAt: 0, promotions: [], banners: [] };

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, message: 'Method not allowed' });
  try {
    if (cache.expiresAt <= Date.now()) {
      const [promotions, banners] = await Promise.allSettled([
        rest('/rest/v1/ad_promotions?select=*&order=created_at.desc&limit=200', {}, 3500),
        rest('/rest/v1/banner_ads?select=*&order=created_at.desc&limit=100', {}, 3500)
      ]);
      cache = {
        expiresAt: Date.now() + 30_000,
        promotions: promotions.status === 'fulfilled' && Array.isArray(promotions.value) ? promotions.value : [],
        banners: banners.status === 'fulfilled' && Array.isArray(banners.value) ? banners.value : []
      };
    }
    res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=30, stale-while-revalidate=120');
    return json(res, 200, { ok: true, promotions: cache.promotions, banners: cache.banners });
  } catch (error) {
    return json(res, 200, { ok: true, promotions: [], banners: [] });
  }
};
