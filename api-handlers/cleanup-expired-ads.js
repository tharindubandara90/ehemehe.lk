'use strict';

const { json, supabaseAdminConfig } = require('../lib/otp-utils');
const { AD_LIFETIME_DAYS, cleanupExpiredAndDemoAds } = require('../lib/ad-lifecycle');

function authorized(req) {
  const expected = String(process.env.CRON_SECRET || '').trim();
  if (!expected) return true;
  const provided = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  return provided.length > 0 && provided === expected;
}

module.exports = async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    return json(res, 405, { ok: false, message: 'Method not allowed' });
  }
  if (!authorized(req)) {
    return json(res, 401, { ok: false, message: 'Unauthorized cleanup request.' });
  }

  try {
    const { url, key } = supabaseAdminConfig();
    const result = await cleanupExpiredAndDemoAds(url, key, Date.now());
    res.setHeader?.('Cache-Control', 'no-store');
    return json(res, 200, {
      ok: true,
      lifetimeDays: AD_LIFETIME_DAYS,
      ...result
    });
  } catch (error) {
    return json(res, 500, {
      ok: false,
      message: error?.message || 'Could not clean expired ads.'
    });
  }
};
