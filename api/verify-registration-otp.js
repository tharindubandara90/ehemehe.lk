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
    if (!isValidEmail(email)) throw new Error('Enter a valid email address.');
    if (!isSriLankaMobile(phone)) throw new Error('Enter a valid Sri Lankan mobile number.');
    if (password.length < 6) throw new Error('Password must contain at least 6 characters.');
    if (!/^\d{6}$/.test(code)) throw new Error('Enter the 6-digit OTP code.');

    if (challenge.kind !== 'registration_otp') throw new Error('Invalid registration challenge.');
    if (Date.now() > Number(challenge.expiresAt || 0)) throw new Error('The OTP has expired.');
    if (challenge.email !== email || challenge.phone !== phone) {
      throw new Error('Registration details changed. Request a new OTP.');
    }

    const identifier = challenge.method === 'email' ? email : phone;
    const expected = otpHash(identifier, 'register_account', code, challenge.nonce);
    if (expected !== challenge.codeHash) throw new Error('The OTP code is incorrect.');

    const [emailUser, phoneUser] = await Promise.all([
      findAuthUserByEmail(email),
      findAuthUserByPhone(phone)
    ]);
    if (emailUser || phoneUser) throw new Error('This account already exists.');

    const user = await createAuthUser({
      email,
      phone: `+${phone}`,
      password,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        name,
        phone,
        email,
        registration_method: 'email_and_phone',
        verification_method: challenge.method,
        email_verified: challenge.method === 'email',
        phone_verified: challenge.method === 'sms'
      }
    });

    return json(res, 200, {
      ok: true,
      user: { id: user.id, email: user.email, phone: user.phone }
    });
  } catch (error) {
    return json(res, 400, {
      ok: false,
      message: error.message || 'OTP verification failed.'
    });
  }
};
