const EHM_OTP = (() => {
  const state = {};

  function normalizePhone(input) {
    let raw = String(input || '').trim().replace(/[^\d+]/g, '');
    if (raw.startsWith('+')) raw = raw.slice(1);
    if (raw.startsWith('0094')) raw = raw.slice(2);
    if (raw.startsWith('0') && raw.length === 10) raw = '94' + raw.slice(1);
    if (raw.length === 9 && raw.startsWith('7')) raw = '94' + raw;
    return raw;
  }

  function validPhone(phone) {
    return /^947\d{8}$/.test(normalizePhone(phone));
  }

  async function postJSON(url, payload) {
    const res = await fetch(url, {
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    let data = {};
    try { data = JSON.parse(text); } catch(e) { data = { ok:false, message:text || 'Invalid server response' }; }
    if (!res.ok || data.ok === false) throw new Error(data.message || 'Request failed');
    return data;
  }

  async function request(phone, purpose) {
    const normalized = normalizePhone(phone);
    if (!validPhone(normalized)) throw new Error('Enter a valid Sri Lankan mobile number.');
    const data = await postJSON('/api/request-otp', { phone: normalized, purpose });
    state[purpose] = { phone: normalized, verificationId: data.verificationId, verifiedToken: null };
    return data;
  }

  async function verify(phone, purpose, otp) {
    const normalized = normalizePhone(phone);
    const item = state[purpose];
    if (!item || item.phone !== normalized || !item.verificationId) throw new Error('Request OTP first.');
    const data = await postJSON('/api/verify-otp', {
      phone: normalized,
      purpose,
      otp,
      verificationId: item.verificationId
    });
    state[purpose] = { ...item, verifiedToken: data.verifiedToken, verifiedAt: Date.now() };
    return data;
  }

  function isVerified(phone, purpose) {
    const normalized = normalizePhone(phone);
    const item = state[purpose];
    return !!(item && item.phone === normalized && item.verifiedToken);
  }

  function getVerifiedToken(purpose){ return state[purpose]?.verifiedToken || ''; }

  function restore(phone, purpose, verifiedToken) {
    const normalized=normalizePhone(phone);
    if(!validPhone(normalized)||!purpose||!verifiedToken)return false;
    state[purpose]={phone:normalized,verificationId:null,verifiedToken:String(verifiedToken),verifiedAt:Date.now()};
    return true;
  }

  function reset(purpose) {
    delete state[purpose];
  }

  return { normalizePhone, validPhone, request, verify, isVerified, getVerifiedToken, restore, reset };
})();
