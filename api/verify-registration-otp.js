const {
  json,
  readBody,
  normalizePhone,
  isSriLankaMobile,
  normalizeEmail,
  isValidEmail,
  readToken,
  otpHash,
  createAuthUser,
  findAuthUserByEmail,
  findAuthUserByPhone
} = require('./_otp-utils');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { ok: false, message: 'Method not allowed' });
  }

  try {
    const body = await readBody(req);
    const name = String(body.name || '').trim();
    const email = normalizeEmail(body.email);
    const phone = normalizePhone(body.phone);
    const password = String(body.password || '');
    const code = String(body.code || '').trim();
    const challenge = readToken(body.challenge);

    if (name.length < 2) throw new Error('Enter your full name.');
    if (!isSriLankaMobile(phone)) throw new Error('Enter a valid Sri Lankan mobile number.');
    if (email && !isValidEmail(email)) throw new Error('Enter a valid email address or leave it blank.');
    if (password.length < 6) throw new Error('Password must contain at least 6 characters.');
    if (!/^\d{6}$/.test(code)) throw new Error('Enter the 6-digit OTP code.');

    if (challenge.kind !== 'registration_sms_otp') {
      throw new Error('Invalid registration challenge.');
    }
    if (Date.now() > Number(challenge.expiresAt || 0)) {
      throw new Error('The OTP has expired.');
    }
    if (challenge.phone !== phone || normalizeEmail(challenge.email) !== email) {
      throw new Error('Registration details changed. Request a new OTP.');
    }

    const expected = otpHash(phone, 'register_account', code, challenge.nonce);
    if (expected !== challenge.codeHash) {
      throw new Error('The OTP code is incorrect.');
    }

    const phoneUser = await findAuthUserByPhone(phone);
    if (phoneUser) throw new Error('An account already exists with this mobile number.');

    if (email) {
      const emailUser = await findAuthUserByEmail(email);
      if (emailUser) throw new Error('An account already exists with this email.');
    }

    const createPayload = {
      phone: `+${phone}`,
      password,
      phone_confirm: true,
      user_metadata: {
        name,
        phone,
        registration_method: 'phone',
        verification_method: 'sms',
        phone_verified: true
      }
    };

    if (email) {
      createPayload.email = email;
      createPayload.email_confirm = true;
      createPayload.user_metadata.email = email;
    }

    const user = await createAuthUser(createPayload);

    return json(res, 200, {
      ok: true,
      user: {
        id: user.id,
        email: user.email || null,
        phone: user.phone
      }
    });
  } catch (error) {
    return json(res, 400, {
      ok: false,
      message: error.message || 'SMS OTP verification failed.'
    });
  }
};
