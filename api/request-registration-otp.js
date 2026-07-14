const {
  json,
  readBody,
  normalizePhone,
  isSriLankaMobile,
  normalizeEmail,
  isValidEmail,
  generateOtp,
  expiryMinutes,
  makeToken,
  otpHash,
  sendTextLkSms,
  readSiteSettings,
  findAuthUserByEmail,
  findAuthUserByPhone
} = require('./_otp-utils');
const crypto = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { ok: false, message: 'Method not allowed' });
  }

  try {
    const body = await readBody(req);
    const email = normalizeEmail(body.email);
    const phone = normalizePhone(body.phone);
    const settings = await readSiteSettings();

    if (!isSriLankaMobile(phone)) {
      return json(res, 400, { ok: false, message: 'Enter a valid Sri Lankan mobile number.' });
    }
    if (email && !isValidEmail(email)) {
      return json(res, 400, { ok: false, message: 'Enter a valid email address or leave it blank.' });
    }
    if (!(settings.smsOtpEnabled && settings.smsRegisterOtp)) {
      return json(res, 403, { ok: false, message: 'SMS registration OTP is disabled.' });
    }

    const phoneUser = await findAuthUserByPhone(phone);
    if (phoneUser) {
      return json(res, 409, { ok: false, message: 'An account already exists with this mobile number.' });
    }

    if (email) {
      const emailUser = await findAuthUserByEmail(email);
      if (emailUser) {
        return json(res, 409, { ok: false, message: 'An account already exists with this email.' });
      }
    }

    const code = generateOtp();
    const nonce = crypto.randomBytes(16).toString('hex');
    const expiresAt = Date.now() + expiryMinutes() * 60 * 1000;

    await sendTextLkSms({
      phone,
      message: `Your ehemehe.lk verification code is ${code}. Do not share this code.`
    });

    const challenge = makeToken({
      kind: 'registration_sms_otp',
      phone,
      email,
      nonce,
      codeHash: otpHash(phone, 'register_account', code, nonce),
      expiresAt
    });

    return json(res, 200, {
      ok: true,
      challenge,
      destination: `+${phone.slice(0, 4)}****${phone.slice(-3)}`,
      expiresInMinutes: expiryMinutes()
    });
  } catch (error) {
    return json(res, 400, {
      ok: false,
      message: error.message || 'Could not send the SMS OTP.'
    });
  }
};
