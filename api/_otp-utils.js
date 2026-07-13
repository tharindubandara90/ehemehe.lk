const crypto = require('crypto');

const TEXTLK_SEND_ENDPOINT = 'https://app.text.lk/api/v3/sms/send';

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
  const url = process.env.SUPABASE_URL;
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

module.exports = {
  json, readBody, normalizePhone, isSriLankaMobile, generateOtp, expiryMinutes,
  makeToken, readToken, otpHash, sendTextLkSms, otpMessage, logOtpEvent
};
