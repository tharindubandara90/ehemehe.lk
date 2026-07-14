const {
  json,
  readBody,
  normalizePhone,
  isSriLankaMobile,
  assertVerifiedToken,
  createAuthUser,
  readSiteSettings
} = require('./_otp-utils');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { ok: false, message: 'Method not allowed' });
  }

  try {
    const body = await readBody(req);
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = normalizePhone(body.phone);
    const password = String(body.password || '');

    if (name.length < 2) {
      return json(res, 400, { ok: false, message: 'Enter your full name.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json(res, 400, { ok: false, message: 'Enter a valid email address.' });
    }
    if (!isSriLankaMobile(phone)) {
      return json(res, 400, { ok: false, message: 'Enter a valid Sri Lankan mobile number.' });
    }
    if (password.length < 6) {
      return json(res, 400, { ok: false, message: 'Password must contain at least 6 characters.' });
    }
    assertVerifiedToken(body.verifiedToken, phone, ['register_account']);

    const user = await createAuthUser({
      email,
      phone: `+${phone}`,
      password,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        name,
        phone,
        phone_verified: true,
        registration_method: 'email_and_phone',
        verification_method: 'sms'
      }
    });

    return json(res, 200, {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    return json(res, 400, {
      ok: false,
      message: error.message || 'Could not create the verified account.'
    });
  }
};
