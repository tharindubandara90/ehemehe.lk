const {
  json,
  readBody,
  findAuthUserByIdentifier,
  signInAuthUserWithPassword,
  publicUserProfile
} = require('./_otp-utils');

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
    const identifier = String(body.identifier || '').trim();
    const password = String(body.password || '');
    if (!identifier || password.length < 6) {
      return json(res, 400, { ok: false, message: 'Enter your phone/email and password correctly.' });
    }

    const user = await findAuthUserByIdentifier(identifier);
    if (!user) {
      return json(res, 400, { ok: false, message: 'Incorrect phone/email or password.' });
    }

    const signedIn = await signInAuthUserWithPassword(user, password);
    return json(res, 200, {
      ok: true,
      session: sessionPayload(signedIn.data),
      user: publicUserProfile(signedIn.account)
    });
  } catch (error) {
    return json(res, 400, {
      ok: false,
      message: error.message || 'Login failed.'
    });
  }
};
