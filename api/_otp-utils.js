const crypto = require('crypto');

const TEXTLK_SEND_ENDPOINT = 'https://app.text.lk/api/v3/sms/send';
const DEFAULT_SUPABASE_URL = 'https://ieymsjeywkapqeniirlm.supabase.co';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) reject(new Error('Request body too large'));
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (e) { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function normalizePhone(input) {
  let raw = String(input || '').trim();
  raw = raw.replace(/[^\d+]/g, '');
  if (raw.startsWith('+')) raw = raw.slice(1);
  if (raw.startsWith('0094')) raw = raw.slice(2);
  if (raw.startsWith('0') && raw.length === 10) raw = '94' + raw.slice(1);
  if (raw.length === 9 && raw.startsWith('7')) raw = '94' + raw;
  return raw;
}

function isSriLankaMobile(phone) {
  return /^947\d{8}$/.test(phone);
}

function secret() {
  const s = process.env.OTP_SECRET || process.env.TEXTLK_API_TOKEN || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error('OTP_SECRET is not configured.');
  return s;
}

function hmac(value) {
  return crypto.createHmac('sha256', secret()).update(String(value)).digest('hex');
}

function makeToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = hmac(body);
  return `${body}.${sig}`;
}

function readToken(token) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) throw new Error('Invalid verification token.');
  if (hmac(body) !== sig) throw new Error('Invalid verification signature.');
  return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
}

function otpHash(phone, purpose, code, nonce) {
  return hmac(`${phone}|${purpose}|${code}|${nonce}`);
}

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

function expiryMinutes() {
  const n = Number(process.env.OTP_EXPIRY_MINUTES || 5);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 30) : 5;
}

async function sendTextLkSms({ phone, message }) {
  const token = process.env.TEXTLK_API_TOKEN;
  const senderId = process.env.TEXTLK_SENDER_ID || 'EHEMEHE';
  if (!token) throw new Error('TEXTLK_API_TOKEN is not configured.');

  const response = await fetch(TEXTLK_SEND_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      recipient: phone,
      sender_id: senderId,
      type: 'plain',
      message
    })
  });

  let data = {};
  try { data = await response.json(); }
  catch (e) { data = { message: await response.text() }; }

  const ok = response.ok && (data.status === true || data.status === 'success' || data.message);
  if (!ok) {
    throw new Error(data.message || `Text.lk SMS failed with HTTP ${response.status}`);
  }
  return data;
}

function otpMessage(code, purpose) {
  const template = process.env.OTP_SMS_TEMPLATE || 'Your ehemehe.lk verification code is {{code}}. Do not share this code.';
  return template.replaceAll('{{code}}', code).replaceAll('{{purpose}}', purpose || 'verification');
}

async function logOtpEvent(row) {
  const url = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return;
  try {
    await fetch(`${url.replace(/\/$/,'')}/rest/v1/sms_otp_logs`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(row)
    });
  } catch (e) {
    console.warn('OTP log skipped:', e.message);
  }
}

function boolValue(value, fallback=true) {
  if (value === undefined || value === null || value === '') return fallback;
  return !['false','0','off','disabled','no'].includes(String(value).toLowerCase());
}

async function readSiteSettings() {
  const defaults = {
    emailOtpEnabled:true, emailRegisterOtp:true, emailPasswordResetOtp:true,
    smsOtpEnabled:true, smsRegisterOtp:true, smsPasswordChangeOtp:true, smsAdPhoneOtp:true
  };
  const url = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return defaults;
  const names = [
    'email_otp_enabled','email_otp_register_enabled','email_otp_password_reset_enabled',
    'sms_otp_enabled','sms_otp_register_enabled','sms_otp_password_change_enabled','sms_otp_ad_phone_enabled'
  ];
  try {
    const response = await fetch(`${url.replace(/\/$/,'')}/rest/v1/site_settings?select=key,value&key=in.(${names.join(',')})`, {
      headers:{apikey:key,Authorization:`Bearer ${key}`}
    });
    if (!response.ok) return defaults;
    const rows = await response.json();
    const map = Object.fromEntries((rows||[]).map(row=>[row.key,row.value]));
    return {
      emailOtpEnabled:boolValue(map.email_otp_enabled,true),
      emailRegisterOtp:boolValue(map.email_otp_register_enabled,true),
      emailPasswordResetOtp:boolValue(map.email_otp_password_reset_enabled,true),
      smsOtpEnabled:boolValue(map.sms_otp_enabled,true),
      smsRegisterOtp:boolValue(map.sms_otp_register_enabled,true),
      smsPasswordChangeOtp:boolValue(map.sms_otp_password_change_enabled,true),
      smsAdPhoneOtp:boolValue(map.sms_otp_ad_phone_enabled,true)
    };
  } catch(e) { return defaults; }
}

function assertVerifiedToken(token, phone, allowedPurposes) {
  const data = readToken(token);
  const normalized = normalizePhone(phone);
  const purposes = Array.isArray(allowedPurposes) ? allowedPurposes : [allowedPurposes];
  if (!data.verified || data.phone !== normalized || !purposes.includes(data.purpose)) throw new Error('Phone verification is invalid.');
  if (Date.now() > Number(data.expiresAt || 0)) throw new Error('Phone verification expired.');
  return data;
}

function supabaseAdminConfig() {
  const url = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service role is not configured.');
  return { url:url.replace(/\/$/,''), key };
}

async function createAuthUser(payload) {
  const {url,key}=supabaseAdminConfig();
  const response=await fetch(`${url}/auth/v1/admin/users`,{
    method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(payload)
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.msg || data.message || data.error_description || 'Could not create account.');
  return data;
}

async function findAuthUserByPhone(phone) {
  const {url,key}=supabaseAdminConfig();
  const normalized=normalizePhone(phone);
  for(let page=1;page<=10;page+=1){
    const response=await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=100`,{headers:{apikey:key,Authorization:`Bearer ${key}`}});
    const data=await response.json().catch(()=>({users:[]}));
    if(!response.ok) throw new Error(data.message || 'Could not read account.');
    const users=Array.isArray(data.users)?data.users:(Array.isArray(data)?data:[]);
    const match=users.find(user=>normalizePhone(user.phone||user.user_metadata?.phone)===normalized);
    if(match) return match;
    if(users.length<100) break;
  }
  return null;
}

async function updateAuthUser(userId,payload) {
  const {url,key}=supabaseAdminConfig();
  const response=await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(userId)}`,{
    method:'PUT',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(payload)
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.message || data.msg || 'Could not update account.');
  return data;
}

module.exports = {
  json, readBody, normalizePhone, isSriLankaMobile, generateOtp, expiryMinutes,
  makeToken, readToken, otpHash, sendTextLkSms, otpMessage, logOtpEvent,
  readSiteSettings, assertVerifiedToken, createAuthUser, findAuthUserByPhone, updateAuthUser
};
