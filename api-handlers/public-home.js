const { json } = require('../lib/otp-utils');
const { queryAds, normalizeAd, rest } = require('../lib/public-ads-utils');

let cache = { expiresAt: 0, limit: 0, payload: null };

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, message: 'Method not allowed' });

  try {
    const url = new URL(req.url, 'http://localhost');
    const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit')) || 80, 120));
    const now = Date.now();

    if (!cache.payload || cache.expiresAt <= now || cache.limit < limit) {
      const [adsResult, promotionsResult, bannersResult] = await Promise.allSettled([
        queryAds({ limit, approvedOnly: true }),
        rest('/rest/v1/ad_promotions?select=*&order=created_at.desc&limit=200', {}, 3500),
        rest('/rest/v1/banner_ads?select=*&order=created_at.desc&limit=100', {}, 3500)
      ]);

      if (adsResult.status !== 'fulfilled') throw adsResult.reason;

      cache = {
        expiresAt: now + 30_000,
        limit,
        payload: {
          ads: adsResult.value.map((row) => normalizeAd(row, false)),
          promotions: promotionsResult.status === 'fulfilled' && Array.isArray(promotionsResult.value) ? promotionsResult.value : [],
          banners: bannersResult.status === 'fulfilled' && Array.isArray(bannersResult.value) ? bannersResult.value : []
        }
      };
    }

    res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=30, stale-while-revalidate=120');
    return json(res, 200, {
      ok: true,
      ads: cache.payload.ads.slice(0, limit),
      promotions: cache.payload.promotions,
      banners: cache.payload.banners
    });
  } catch (error) {
    return json(res, 502, {
      ok: false,
      message: error?.message || 'Could not load marketplace data.',
      ads: [],
      promotions: [],
      banners: []
    });
  }
};
