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
  findAuthUserByPhone,
  updateAuthUser,
  internalAuthEmail,
  signInAuthUserWithPassword,
  publicUserProfile
} = require('../lib/otp-utils');

function sessionPayload(data) {
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    expires_at: data.expires_at,
    token_type: data.token_type || 'bearer'
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { ok: false, message: 'Method not allowed' });
  }

  try {
    const body = await readBody(req);
    const name = String(body.name || '').trim();
    const contactEmail = normalizeEmail(body.email);
    const phone = normalizePhone(body.phone);
    const password = String(body.password || '');
    const code = String(body.code || '').trim();
    const challenge = readToken(body.challenge);

    if (name.length < 2) throw new Error('Enter your full name.');
    if (!isSriLankaMobile(phone)) throw new Error('Enter a valid Sri Lankan mobile number.');
    if (contactEmail && !isValidEmail(contactEmail)) throw new Error('Enter a valid email address or leave it blank.');
    if (password.length < 6) throw new Error('Password must contain at least 6 characters.');
    if (!/^\d{6}$/.test(code)) throw new Error('Enter the 6-digit OTP code.');
    if (challenge.kind !== 'registration_sms_otp') throw new Error('Invalid registration challenge.');
    if (Date.now() > Number(challenge.expiresAt || 0)) throw new Error('The OTP has expired.');
    if (challenge.phone !== phone || normalizeEmail(challenge.email) !== contactEmail) {
      throw new Error('Registration details changed. Request a new OTP.');
    }

    const expected = otpHash(phone, 'register_account', code, challenge.nonce);
    if (expected !== challenge.codeHash) throw new Error('The OTP code is incorrect.');

    let user = await findAuthUserByPhone(phone);

    // Recover accounts created by the previous phone-auth flow. Those accounts
    // were created correctly, but browser login failed because Supabase Phone
    // Provider was disabled. We now sign them in through their email identity.
    if (user) {
      const metadata = user.user_metadata || {};
      user = await updateAuthUser(user.id, {
        user_metadata: {
          ...metadata,
          name: name || metadata.name,
          phone,
          contact_email: contactEmail || metadata.contact_email || metadata.email || '',
          phone_verified: true,
          verification_method: 'sms'
        }
      });
      const signedIn = await signInAuthUserWithPassword(user, password);
      return json(res, 200, {
        ok: true,
        recovered_existing_account: true,
        session: sessionPayload(signedIn.data),
        user: publicUserProfile(signedIn.account)
      });
    }

    if (contactEmail) {
      const emailUser = await findAuthUserByEmail(contactEmail);
      if (emailUser) throw new Error('An account already exists with this email address.');
    }

    const authEmail = internalAuthEmail(phone);
    user = await createAuthUser({
      email: authEmail,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        phone,
        contact_email: contactEmail,
        auth_email: authEmail,
        registration_method: 'phone',
        verification_method: 'sms',
        phone_verified: true
      }
    });

    const signedIn = await signInAuthUserWithPassword(user, password);
    return json(res, 200, {
      ok: true,
      session: sessionPayload(signedIn.data),
      user: publicUserProfile(signedIn.account)
    });
  } catch (error) {
    return json(res, 400, {
      ok: false,
      message: error.message || 'SMS OTP verification failed.'
    });
  }
};
