const { json } = require('../lib/otp-utils');
const { queryAds, normalizeAd, parseJson, queryAdImageCount } = require('../lib/public-ads-utils');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, message: 'Method not allowed' });
  try {
    const url = new URL(req.url, 'http://localhost');
    const id = String(url.searchParams.get('id') || '').trim();
    if (!id || id.length > 100 || !/^[a-zA-Z0-9._:-]+$/.test(id)) {
      return json(res, 400, { ok: false, message: 'Invalid ad ID.' });
    }
    const rows = await queryAds({ id, approvedOnly: true });
    const row = rows[0];
    if (!row || String(row.status || '').toLowerCase() === 'rejected') {
      return json(res, 404, { ok: false, message: 'Ad not found.' });
    }
    const custom = parseJson(row.custom_fields, {});
    let imageCount = Number(custom.image_count || custom.images_count || 0);
    if (!Number.isFinite(imageCount) || imageCount < 1) {
      try { imageCount = await queryAdImageCount(id); }
      catch (_) { imageCount = row.image_url ? 1 : 0; }
    }
    row._image_count = Math.max(0, Math.min(10, Math.round(imageCount || 0)));
    res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=30, stale-while-revalidate=120');
    return json(res, 200, { ok: true, ad: normalizeAd(row, true) });
  } catch (error) {
    return json(res, 502, { ok: false, message: error.message || 'Could not load the ad.' });
  }
};
