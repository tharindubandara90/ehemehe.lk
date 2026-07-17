const {
  json, readBody, normalizePhone, isSriLankaMobile, generateOtp, expiryMinutes,
  makeToken, otpHash, sendTextLkSms, otpMessage, logOtpEvent, readSiteSettings, findAuthUserByPhone
} = require('../lib/otp-utils');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok:false, message:'Method not allowed' });

  try {
    const body = await readBody(req);
    const phone = normalizePhone(body.phone);
    const purpose = String(body.purpose || 'verification').replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'verification';

    if (!isSriLankaMobile(phone)) {
      return json(res, 400, { ok:false, message:'Enter a valid Sri Lankan mobile number.' });
    }

    const settings = await readSiteSettings();
    const allowed = settings.smsOtpEnabled && (
      (['register','register_phone','register_account'].includes(purpose) && settings.smsRegisterOtp) ||
      (['password_change','password_reset_phone'].includes(purpose) && settings.smsPasswordChangeOtp) ||
      ((purpose === 'post_ad' || /^post_ad_contact_[a-z0-9_-]{4,40}$/i.test(purpose)) && settings.smsAdPhoneOtp) ||
      purpose === 'admin_test'
    );
    if (!allowed) return json(res, 403, {ok:false,message:'SMS OTP is disabled for this action.'});

    if (purpose === 'password_reset_phone') {
      const user = await findAuthUserByPhone(phone);
      if (!user) {
        return json(res, 404, {
          ok: false,
          message: 'No account was found for this phone number.'
        });
      }
    }

    const code = generateOtp();
    const nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const expiresAt = Date.now() + expiryMinutes() * 60 * 1000;
    const verificationId = makeToken({
      phone,
      purpose,
      nonce,
      expiresAt,
      codeHash: otpHash(phone, purpose, code, nonce)
    });

    await sendTextLkSms({ phone, message: otpMessage(code, purpose) });
    await logOtpEvent({
      phone,
      purpose,
      status: 'sent',
      provider: 'textlk',
      expires_at: new Date(expiresAt).toISOString()
    });

    return json(res, 200, {
      ok: true,
      message: 'OTP sent successfully.',
      phone,
      expiresInSeconds: Math.round((expiresAt - Date.now()) / 1000),
      verificationId
    });
  } catch (error) {
    console.error('request-otp error:', error);
    return json(res, 500, { ok:false, message:error.message || 'Failed to send OTP.' });
  }
};
