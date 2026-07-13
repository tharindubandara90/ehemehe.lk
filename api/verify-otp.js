const {
  json, readBody, normalizePhone, isSriLankaMobile, readToken, otpHash, makeToken, logOtpEvent
} = require('./_otp-utils');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok:false, message:'Method not allowed' });

  try {
    const body = await readBody(req);
    const phone = normalizePhone(body.phone);
    const purpose = String(body.purpose || 'verification').replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'verification';
    const otp = String(body.otp || '').trim();
    const tokenData = readToken(body.verificationId);

    if (!isSriLankaMobile(phone)) return json(res, 400, { ok:false, message:'Invalid phone number.' });
    if (!/^\d{6}$/.test(otp)) return json(res, 400, { ok:false, message:'Enter the 6-digit OTP code.' });
    if (tokenData.phone !== phone || tokenData.purpose !== purpose) return json(res, 400, { ok:false, message:'OTP does not match this phone number.' });
    if (Date.now() > Number(tokenData.expiresAt)) return json(res, 400, { ok:false, message:'OTP expired. Request a new code.' });

    const expected = otpHash(phone, purpose, otp, tokenData.nonce);
    if (expected !== tokenData.codeHash) {
      await logOtpEvent({ phone, purpose, status:'failed', provider:'textlk' });
      return json(res, 400, { ok:false, message:'Invalid OTP code.' });
    }

    const verifiedToken = makeToken({
      phone,
      purpose,
      verified: true,
      verifiedAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    });

    await logOtpEvent({ phone, purpose, status:'verified', provider:'textlk', verified_at:new Date().toISOString() });

    return json(res, 200, {
      ok: true,
      message: 'Phone verified successfully.',
      phone,
      verifiedToken
    });
  } catch (error) {
    console.error('verify-otp error:', error);
    return json(res, 500, { ok:false, message:error.message || 'Failed to verify OTP.' });
  }
};
