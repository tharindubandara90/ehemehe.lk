const { json } = require('./_otp-utils');
const { queryAds, normalizeAd } = require('./_public-ads-utils');

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
    res.setHeader('Cache-Control', 'public, max-age=20, s-maxage=45, stale-while-revalidate=180');
    return json(res, 200, { ok: true, ad: normalizeAd(row, true) });
  } catch (error) {
    return json(res, 502, { ok: false, message: error.message || 'Could not load the ad.' });
  }
};
