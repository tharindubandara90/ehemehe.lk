(function (global) {
  'use strict';

  if (global.EHM_SMS && global.EHM_SMS.__unifiedService === true) {
    global.EHM_OTP = global.EHM_SMS.otp;
    return;
  }

  const VERSION = '20260715-unified-sms-v1';
  const OTP_STATE_KEY = 'ehemehe:sms:otp-state:v1';
  const REGISTRATION_STATE_KEY = 'ehemehe:sms:registration-state:v1';
  const DEFAULT_TIMEOUT_MS = 20000;
  const memory = Object.create(null);

  function storage() {
    try { return global.sessionStorage || null; }
    catch (_) { return null; }
  }

  function readStored(key, fallback) {
    const target = storage();
    if (!target) return fallback;
    try {
      const parsed = JSON.parse(target.getItem(key) || 'null');
      return parsed === null ? fallback : parsed;
    } catch (_) {
      return fallback;
    }
  }

  function writeStored(key, value) {
    const target = storage();
    if (!target) return;
    try { target.setItem(key, JSON.stringify(value)); }
    catch (_) {}
  }

  function removeStored(key) {
    const target = storage();
    if (!target) return;
    try { target.removeItem(key); }
    catch (_) {}
  }

  function normalizePhone(input) {
    let raw = String(input || '').trim().replace(/[^\d+]/g, '');
    if (raw.startsWith('+')) raw = raw.slice(1);
    if (raw.startsWith('0094')) raw = raw.slice(2);
    if (raw.startsWith('0') && raw.length === 10) raw = `94${raw.slice(1)}`;
    if (raw.length === 9 && raw.startsWith('7')) raw = `94${raw}`;
    return raw;
  }

  function validPhone(phone) {
    return /^947\d{8}$/.test(normalizePhone(phone));
  }

  function normalizeEmail(input) {
    return String(input || '').trim().toLowerCase();
  }

  function validEmail(email) {
    const value = normalizeEmail(email);
    return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function cleanPurpose(value, fallback = 'verification') {
    const purpose = String(value || fallback)
      .replace(/[^a-z0-9_-]/gi, '')
      .slice(0, 40);
    return purpose || fallback;
  }

  function event(name, detail) {
    try {
      global.dispatchEvent(new CustomEvent(name, { detail }));
    } catch (_) {}
  }

  function otpState() {
    const stored = readStored(OTP_STATE_KEY, {});
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return {};
    return stored;
  }

  function saveOtpItem(purpose, item) {
    const all = otpState();
    all[purpose] = item;

    // Keep only the newest twenty workflows so stale contact rows cannot grow
    // sessionStorage indefinitely.
    const entries = Object.entries(all)
      .sort((a, b) => Number(b[1]?.updatedAt || 0) - Number(a[1]?.updatedAt || 0))
      .slice(0, 20);
    writeStored(OTP_STATE_KEY, Object.fromEntries(entries));
    memory[purpose] = item;
    event('ehm:sms-state', { purpose, state: item });
  }

  function readOtpItem(purpose) {
    if (memory[purpose]) return memory[purpose];
    const item = otpState()[purpose];
    if (item) memory[purpose] = item;
    return item || null;
  }

  function removeOtpItem(purpose) {
    delete memory[purpose];
    const all = otpState();
    delete all[purpose];
    writeStored(OTP_STATE_KEY, all);
    event('ehm:sms-state', { purpose, state: null });
  }

  async function readResponse(response) {
    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (_) {
      data = {
        ok: false,
        message: text
          ? `The server returned a non-JSON response (HTTP ${response.status}).`
          : `The server returned an empty response (HTTP ${response.status}).`
      };
    }

    if (!response.ok || data.ok === false) {
      const error = new Error(data.message || `SMS request failed (HTTP ${response.status}).`);
      error.status = response.status;
      error.payload = data;
      throw error;
    }
    return data;
  }

  async function postJson(url, payload, options = {}) {
    const timeoutMs = Number(options.timeoutMs || DEFAULT_TIMEOUT_MS);
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller
      ? setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : DEFAULT_TIMEOUT_MS)
      : null;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-EheMehe-SMS-Client': VERSION
        },
        cache: 'no-store',
        credentials: 'same-origin',
        signal: controller?.signal,
        body: JSON.stringify(payload || {})
      });
      return await readResponse(response);
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new Error('The SMS service took too long to respond. Try again.');
      }
      if (error instanceof Error) throw error;
      throw new Error('Could not connect to the SMS service.');
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  const otp = {
    normalizePhone,
    validPhone,

    async request(phone, purpose) {
      const normalized = normalizePhone(phone);
      const workflow = cleanPurpose(purpose);
      if (!validPhone(normalized)) {
        throw new Error('Enter a valid Sri Lankan mobile number.');
      }

      const data = await postJson('/api/request-otp', {
        phone: normalized,
        purpose: workflow
      });

      saveOtpItem(workflow, {
        phone: normalized,
        purpose: workflow,
        verificationId: data.verificationId || '',
        verifiedToken: '',
        requestedAt: Date.now(),
        expiresAt: Date.now() + Number(data.expiresInSeconds || 300) * 1000,
        updatedAt: Date.now()
      });
      return data;
    },

    async verify(phone, purpose, code) {
      const normalized = normalizePhone(phone);
      const workflow = cleanPurpose(purpose);
      const otpCode = String(code || '').trim();
      const item = readOtpItem(workflow);

      if (!validPhone(normalized)) {
        throw new Error('Enter a valid Sri Lankan mobile number.');
      }
      if (!/^\d{6}$/.test(otpCode)) {
        throw new Error('Enter the 6-digit OTP code.');
      }
      if (!item || item.phone !== normalized || !item.verificationId) {
        throw new Error('Request a new OTP first.');
      }

      const data = await postJson('/api/verify-otp', {
        phone: normalized,
        purpose: workflow,
        otp: otpCode,
        verificationId: item.verificationId
      });

      saveOtpItem(workflow, {
        ...item,
        phone: normalized,
        purpose: workflow,
        verifiedToken: data.verifiedToken || '',
        verifiedAt: Date.now(),
        expiresAt: Date.now() + (workflow === 'password_reset_phone'
          ? 15 * 60 * 1000
          : 24 * 60 * 60 * 1000),
        updatedAt: Date.now()
      });
      return data;
    },

    isVerified(phone, purpose) {
      const normalized = normalizePhone(phone);
      const item = readOtpItem(cleanPurpose(purpose));
      return Boolean(
        item &&
        item.phone === normalized &&
        item.verifiedToken &&
        (!item.expiresAt || Date.now() <= Number(item.expiresAt))
      );
    },

    getVerifiedToken(purpose) {
      return String(readOtpItem(cleanPurpose(purpose))?.verifiedToken || '');
    },

    getState(purpose) {
      const item = readOtpItem(cleanPurpose(purpose));
      return item ? { ...item } : null;
    },

    restore(phone, purpose, verifiedToken) {
      const normalized = normalizePhone(phone);
      const workflow = cleanPurpose(purpose);
      if (!validPhone(normalized) || !workflow || !verifiedToken) return false;

      saveOtpItem(workflow, {
        phone: normalized,
        purpose: workflow,
        verificationId: '',
        verifiedToken: String(verifiedToken),
        verifiedAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        updatedAt: Date.now()
      });
      return true;
    },

    reset(purpose) {
      removeOtpItem(cleanPurpose(purpose));
    }
  };

  const registration = {
    async request(details) {
      const phone = normalizePhone(details?.phone);
      const email = normalizeEmail(details?.email);
      if (!validPhone(phone)) throw new Error('Enter a valid Sri Lankan mobile number.');
      if (!validEmail(email)) throw new Error('Enter a valid email address or leave it blank.');

      const data = await postJson('/api/request-registration-otp', { phone, email });
      writeStored(REGISTRATION_STATE_KEY, {
        phone,
        email,
        challenge: data.challenge || '',
        destination: data.destination || '',
        requestedAt: Date.now(),
        updatedAt: Date.now()
      });
      event('ehm:sms-registration-state', { phone, email, challenge: data.challenge || '' });
      return data;
    },

    async verifyAndCreate(details) {
      const stored = readStored(REGISTRATION_STATE_KEY, {});
      const phone = normalizePhone(details?.phone);
      const email = normalizeEmail(details?.email);
      const code = String(details?.code || '').trim();
      const challenge = String(details?.challenge || stored?.challenge || '');

      if (!validPhone(phone)) throw new Error('Enter a valid Sri Lankan mobile number.');
      if (!validEmail(email)) throw new Error('Enter a valid email address or leave it blank.');
      if (!/^\d{6}$/.test(code)) throw new Error('Enter the 6-digit OTP code.');
      if (!challenge) throw new Error('Request a new OTP first.');

      const data = await postJson('/api/verify-registration-otp', {
        challenge,
        code,
        name: String(details?.name || '').trim(),
        email,
        phone,
        password: String(details?.password || '')
      });
      removeStored(REGISTRATION_STATE_KEY);
      event('ehm:sms-registration-complete', { phone, user: data.user || null });
      return data;
    },

    getState() {
      const state = readStored(REGISTRATION_STATE_KEY, null);
      return state && typeof state === 'object' ? { ...state } : null;
    },

    reset() {
      removeStored(REGISTRATION_STATE_KEY);
      event('ehm:sms-registration-state', null);
    }
  };

  const passwordReset = {
    purpose: 'password_reset_phone',

    request(phone) {
      otp.reset(this.purpose);
      return otp.request(phone, this.purpose);
    },

    verify(phone, code) {
      return otp.verify(phone, this.purpose, code);
    },

    async update(phone, password, verifiedToken) {
      const normalized = normalizePhone(phone);
      const token = String(verifiedToken || otp.getVerifiedToken(this.purpose));
      if (!validPhone(normalized)) throw new Error('Enter a valid Sri Lankan mobile number.');
      if (String(password || '').length < 6) {
        throw new Error('Password must contain at least 6 characters.');
      }
      if (!token) throw new Error('Verify the SMS OTP before setting a new password.');

      const data = await postJson('/api/reset-phone-password', {
        phone: normalized,
        password: String(password),
        verifiedToken: token
      });
      otp.reset(this.purpose);
      return data;
    },

    getVerifiedToken() {
      return otp.getVerifiedToken(this.purpose);
    },

    reset() {
      otp.reset(this.purpose);
    }
  };

  const contact = {
    request(phone, purpose) {
      return otp.request(phone, cleanPurpose(purpose, 'post_ad'));
    },
    verify(phone, purpose, code) {
      return otp.verify(phone, cleanPurpose(purpose, 'post_ad'), code);
    },
    restore(phone, purpose, token) {
      return otp.restore(phone, cleanPurpose(purpose, 'post_ad'), token);
    },
    reset(purpose) {
      otp.reset(cleanPurpose(purpose, 'post_ad'));
    }
  };

  let settingsPromise = null;
  async function settings(force = false) {
    if (!settingsPromise || force) {
      settingsPromise = fetch('/api/auth-settings', {
        headers: { 'Accept': 'application/json', 'X-EheMehe-SMS-Client': VERSION },
        cache: 'no-store',
        credentials: 'same-origin'
      })
        .then(readResponse)
        .then((data) => data.settings || {})
        .catch(() => ({
          smsOtpEnabled: true,
          smsRegisterOtp: true,
          smsPasswordChangeOtp: true,
          smsAdPhoneOtp: true
        }));
    }
    return settingsPromise;
  }

  const service = {
    __unifiedService: true,
    version: VERSION,
    normalizePhone,
    validPhone,
    normalizeEmail,
    validEmail,
    otp,
    registration,
    passwordReset,
    contact,
    settings,
    postJson,
    whenReady() { return Promise.resolve(service); },
    ready: null
  };
  service.ready = Promise.resolve(service);

  global.EHM_SMS = service;
  // Legacy alias kept for old cached React bundles and fallback pages. It is
  // the same object, not a second OTP implementation or second state store.
  global.EHM_OTP = otp;
  global.__EHM_SMS_SERVICE_VERSION = VERSION;
  event('ehm:sms-ready', { version: VERSION });
})(window);
