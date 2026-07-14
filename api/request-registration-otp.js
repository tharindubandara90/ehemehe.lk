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
  sendRegistrationEmailOtp,
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
    const method = String(body.method || '').toLowerCase();
    const email = normalizeEmail(body.email);
    const phone = normalizePhone(body.phone);
    const settings = await readSiteSettings();

    if (!isValidEmail(email)) {
      return json(res, 400, { ok: false, message: 'Enter a valid email address.' });
    }
    if (!isSriLankaMobile(phone)) {
      return json(res, 400, { ok: false, message: 'Enter a valid Sri Lankan mobile number.' });
    }
    if (!['email', 'sms'].includes(method)) {
      return json(res, 400, { ok: false, message: 'Choose Email OTP or SMS OTP.' });
    }

    const [emailUser, phoneUser] = await Promise.all([
      findAuthUserByEmail(email),
      findAuthUserByPhone(phone)
    ]);
    if (emailUser) {
      return json(res, 409, { ok: false, message: 'An account already exists with this email.' });
    }
    if (phoneUser) {
      return json(res, 409, { ok: false, message: 'An account already exists with this mobile number.' });
    }

    if (method === 'email' && !(settings.emailOtpEnabled && settings.emailRegisterOtp)) {
      return json(res, 403, { ok: false, message: 'Email registration OTP is disabled.' });
    }
    if (method === 'sms' && !(settings.smsOtpEnabled && settings.smsRegisterOtp)) {
      return json(res, 403, { ok: false, message: 'SMS registration OTP is disabled.' });
    }

    const code = generateOtp();
    const nonce = crypto.randomBytes(16).toString('hex');
    const expiresAt = Date.now() + expiryMinutes() * 60 * 1000;
    const identifier = method === 'email' ? email : phone;

    if (method === 'email') {
      await sendRegistrationEmailOtp({ email, code });
    } else {
      await sendTextLkSms({
        phone,
        message: `Your ehemehe.lk verification code is ${code}. Do not share this code.`
      });
    }

    const challenge = makeToken({
      kind: 'registration_otp',
      method,
      email,
      phone,
      identifier,
      nonce,
      codeHash: otpHash(identifier, 'register_account', code, nonce),
      expiresAt
    });

    return json(res, 200, {
      ok: true,
      challenge,
      destination: method === 'email'
        ? email.replace(/^(.{2}).*(@.*)$/, '$1***$2')
        : `+${phone.slice(0, 4)}****${phone.slice(-3)}`,
      expiresInMinutes: expiryMinutes()
    });
  } catch (error) {
    return json(res, 400, {
      ok: false,
      message: error.message || 'Could not send the verification OTP.'
    });
  }
};
