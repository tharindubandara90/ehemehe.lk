const { json, supabaseAdminConfig } = require('../lib/otp-utils');

const attemptsByIp = new Map();
const LIMIT_WINDOW_MS = 60 * 60 * 1000;
const LIMIT_COUNT = 8;
const ALLOWED_REASONS = new Set(['scam', 'spam', 'duplicate', 'sold', 'category', 'inappropriate', 'other']);

function readBody(req, maxBytes = 32 * 1024) {
  const parseValue = (value) => {
    if (value === undefined || value === null || value === '') return {};
    if (Buffer.isBuffer(value)) value = value.toString('utf8');
    if (typeof value === 'string') {
      if (Buffer.byteLength(value, 'utf8') > maxBytes) throw new Error('Report is too large.');
      try { return value ? JSON.parse(value) : {}; }
      catch (_) { throw new Error('Invalid report request.'); }
    }
    if (typeof value === 'object') {
      if (Buffer.byteLength(JSON.stringify(value), 'utf8') > maxBytes) throw new Error('Report is too large.');
      return value;
    }
    throw new Error('Invalid report request.');
  };

  if (req.body !== undefined && req.body !== null) {
    return Promise.resolve().then(() => parseValue(req.body));
  }

  return new Promise((resolve, reject) => {
    let raw = '';
    let settled = false;
    req.on('data', (chunk) => {
      if (settled) return;
      raw += chunk;
      if (Buffer.byteLength(raw, 'utf8') > maxBytes) {
        settled = true;
        reject(new Error('Report is too large.'));
      }
    });
    req.on('end', () => {
      if (settled) return;
      try { resolve(parseValue(raw)); }
      catch (error) { reject(error); }
    });
    req.on('error', reject);
  });
}

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .split(',')[0].trim().slice(0, 80);
}

function rateLimit(req) {
  const ip = clientIp(req);
  const now = Date.now();
  const current = attemptsByIp.get(ip) || [];
  const recent = current.filter((time) => now - time < LIMIT_WINDOW_MS);
  if (recent.length >= LIMIT_COUNT) return false;
  recent.push(now);
  attemptsByIp.set(ip, recent);
  return true;
}

function cleanText(value, max) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, message: 'Method not allowed' });
  if (!rateLimit(req)) return json(res, 429, { ok: false, message: 'Too many reports. Please try again later.' });

  try {
    const body = await readBody(req);
    const adId = cleanText(body.adId, 120).replace(/^static-/, '');
    const reason = cleanText(body.reason, 40).toLowerCase();
    const message = cleanText(body.message, 800);
    const reporterEmail = cleanText(body.reporterEmail, 180);
    const pageUrl = cleanText(body.pageUrl, 500);

    if (!adId) throw new Error('Ad ID is missing.');
    if (!ALLOWED_REASONS.has(reason)) throw new Error('Select a valid report reason.');
    if (reporterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail)) throw new Error('Enter a valid email address.');

    const { url, key } = supabaseAdminConfig();
    const reference = `[Listing ID: ${adId}]${pageUrl ? ` [Page: ${pageUrl}]` : ''}`;
    const payload = {
      ad_id: isUuid(adId) ? adId : null,
      reporter_email: reporterEmail || null,
      reason,
      message: `${reference}${message ? `\n${message}` : ''}`.slice(0, 1200),
      status: 'pending'
    };

    const response = await fetch(`${url}/rest/v1/ad_reports`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(payload)
    });
    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch (_) { data = { message: raw }; }

    if (!response.ok) {
      const detail = data.message || data.details || data.hint || `HTTP ${response.status}`;
      const missingTable = data.code === 'PGRST205' || data.code === '42P01' || /ad_reports.*does not exist|could not find.*ad_reports/i.test(detail);
      if (missingTable) {
        return json(res, 503, {
          ok: false,
          code: 'DATABASE_SCHEMA_MISSING_REPORTS',
          message: 'Report storage is not configured. Run supabase_public_interactions_schema.sql once in Supabase SQL Editor.'
        });
      }
      throw new Error(`Could not save the report: ${detail}`);
    }

    const row = Array.isArray(data) ? data[0] : data;
    return json(res, 200, { ok: true, reportId: row?.id || null });
  } catch (error) {
    const configMissing = /service role is not configured/i.test(error.message || '');
    return json(res, configMissing ? 503 : 400, {
      ok: false,
      message: configMissing
        ? 'Report service is not configured on the server.'
        : (error.message || 'Could not submit the report.')
    });
  }
};
