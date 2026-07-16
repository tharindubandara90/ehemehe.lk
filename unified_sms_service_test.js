const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

class Storage {
  constructor() { this.data = new Map(); }
  getItem(key) { return this.data.has(key) ? this.data.get(key) : null; }
  setItem(key, value) { this.data.set(key, String(value)); }
  removeItem(key) { this.data.delete(key); }
}

class MockResponse {
  constructor(status, body) {
    this.status = status;
    this.ok = status >= 200 && status < 300;
    this.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  async text() { return this.body; }
}

const calls = [];
const responses = {
  '/api/auth-settings': { ok: true, settings: { smsOtpEnabled: true, smsRegisterOtp: true, smsPasswordChangeOtp: true, smsAdPhoneOtp: true } },
  '/api/request-otp': { ok: true, verificationId: 'verification-1', message: 'OTP sent successfully.', expiresInSeconds: 300 },
  '/api/verify-otp': { ok: true, verifiedToken: 'verified-token-1', message: 'Phone verified successfully.' },
  '/api/request-registration-otp': { ok: true, challenge: 'registration-challenge-1', destination: '+9477****867' },
  '/api/verify-registration-otp': { ok: true, session: { access_token: 'access', refresh_token: 'refresh' }, user: { id: 'user-1' } },
  '/api/reset-phone-password': { ok: true, message: 'Password updated successfully.' }
};

const listeners = new Map();
const context = {
  console,
  setTimeout,
  clearTimeout,
  AbortController,
  sessionStorage: new Storage(),
  CustomEvent: class CustomEvent { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
  addEventListener(type, listener) {
    if (!listeners.has(type)) listeners.set(type, []);
    listeners.get(type).push(listener);
  },
  removeEventListener() {},
  dispatchEvent(event) {
    for (const listener of listeners.get(event.type) || []) listener(event);
  },
  async fetch(url, options = {}) {
    const path = String(url);
    const payload = options.body ? JSON.parse(options.body) : null;
    calls.push({ path, payload, method: options.method || 'GET' });
    if (!responses[path]) return new MockResponse(404, { ok: false, message: `Unknown ${path}` });
    return new MockResponse(200, responses[path]);
  }
};
context.window = context;
context.globalThis = context;
vm.createContext(context);

const serviceSource = fs.readFileSync('./public/sms-verification-service.js', 'utf8');
vm.runInContext(serviceSource, context, { filename: 'sms-verification-service.js' });

(async () => {
  assert(context.EHM_SMS, 'Unified service must be available immediately.');
  assert.strictEqual(context.EHM_OTP, context.EHM_SMS.otp, 'Legacy EHM_OTP must be the same shared object.');
  assert.strictEqual(context.EHM_SMS.normalizePhone('077 286 6867'), '94772866867');
  assert.strictEqual(context.EHM_SMS.validPhone('0772866867'), true);

  const genericSent = await context.EHM_SMS.otp.request('0772866867', 'post_ad_contact_test1');
  assert.strictEqual(genericSent.verificationId, 'verification-1');
  assert.strictEqual(calls.at(-1).path, '/api/request-otp');
  assert.strictEqual(calls.at(-1).payload.phone, '94772866867');
  assert.strictEqual(calls.at(-1).payload.purpose, 'post_ad_contact_test1');

  const genericVerified = await context.EHM_SMS.otp.verify('94772866867', 'post_ad_contact_test1', '123456');
  assert.strictEqual(genericVerified.verifiedToken, 'verified-token-1');
  assert.strictEqual(context.EHM_SMS.otp.isVerified('0772866867', 'post_ad_contact_test1'), true);
  assert.strictEqual(context.EHM_SMS.otp.getVerifiedToken('post_ad_contact_test1'), 'verified-token-1');

  const registrationSent = await context.EHM_SMS.registration.request({ phone: '0772866867', email: 'test@example.com' });
  assert.strictEqual(registrationSent.challenge, 'registration-challenge-1');
  const registrationCreated = await context.EHM_SMS.registration.verifyAndCreate({
    phone: '0772866867', email: 'test@example.com', name: 'Test User', password: 'secret12', code: '123456'
  });
  assert.strictEqual(registrationCreated.session.access_token, 'access');
  assert.strictEqual(calls.at(-1).path, '/api/verify-registration-otp');
  assert.strictEqual(calls.at(-1).payload.challenge, 'registration-challenge-1');

  await context.EHM_SMS.passwordReset.request('0772866867');
  assert.strictEqual(calls.at(-1).payload.purpose, 'password_reset_phone');
  const resetVerified = await context.EHM_SMS.passwordReset.verify('0772866867', '123456');
  assert.strictEqual(resetVerified.verifiedToken, 'verified-token-1');
  await context.EHM_SMS.passwordReset.update('0772866867', 'newsecret', 'verified-token-1');
  assert.strictEqual(calls.at(-1).path, '/api/reset-phone-password');
  assert.strictEqual(calls.at(-1).payload.verifiedToken, 'verified-token-1');

  assert.strictEqual(context.EHM_SMS.contact.restore('0772866867', 'post_ad_contact_restore1', 'restore-token'), true);
  assert.strictEqual(context.EHM_SMS.otp.getVerifiedToken('post_ad_contact_restore1'), 'restore-token');

  const settings = await context.EHM_SMS.settings();
  assert.strictEqual(settings.smsAdPhoneOtp, true);

  const compatibilitySource = fs.readFileSync('./public/otp-client.js', 'utf8');
  const fakeDocument = {
    querySelector() { return null; },
    createElement() { throw new Error('Compatibility loader should not create a script when shared service exists.'); },
    head: { appendChild() {} }
  };
  context.document = fakeDocument;
  vm.runInContext(compatibilitySource, context, { filename: 'otp-client.js' });
  assert.strictEqual(context.EHM_OTP, context.EHM_SMS.otp);

  console.log('UNIFIED_SMS_SERVICE_TEST_PASSED');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
