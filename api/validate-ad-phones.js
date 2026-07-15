const {
  json, readBody, normalizePhone, isSriLankaMobile,
  assertVerifiedToken, makeToken
} = require('./_otp-utils');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok:false, message:'Method not allowed' });

  try {
    const body = await readBody(req);
    const phones = Array.isArray(body.phones) ? body.phones : [];
    if (!phones.length) return json(res, 400, { ok:false, message:'Add at least one contact phone number.' });
    if (phones.length > 5) return json(res, 400, { ok:false, message:'A maximum of 5 contact phone numbers is allowed.' });

    const normalized = [];
    const seen = new Set();
    for (const item of phones) {
      const phone = normalizePhone(item?.phone);
      const purpose = String(item?.purpose || '');
      const token = String(item?.verifiedToken || '');
      if (!isSriLankaMobile(phone)) throw new Error('One of the contact phone numbers is invalid.');
      if (!/^post_ad_contact_[a-z0-9_-]{4,40}$/i.test(purpose)) throw new Error('Invalid ad phone verification purpose.');
      if (seen.has(phone)) throw new Error('Duplicate contact phone numbers are not allowed.');
      assertVerifiedToken(token, phone, [purpose]);
      seen.add(phone);
      normalized.push(phone);
    }

    const expiresAt = Date.now() + 2 * 60 * 60 * 1000;
    const proof = makeToken({
      kind:'ad_contact_phones_verified', verified:true,
      phones:normalized, verifiedAt:Date.now(), expiresAt
    });

    return json(res, 200, {
      ok:true,
      message:'All contact phone numbers are verified.',
      phones:normalized,
      proof,
      expiresAt
    });
  } catch (error) {
    return json(res, 400, { ok:false, message:error.message || 'Phone verification validation failed.' });
  }
};
