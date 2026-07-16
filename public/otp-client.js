(function (global, document) {
  'use strict';

  const VERSION = '20260715-unified-sms-v1';

  function normalizePhone(input) {
    let raw = String(input || '').trim().replace(/[^\d+]/g, '');
    if (raw.startsWith('+')) raw = raw.slice(1);
    if (raw.startsWith('0094')) raw = raw.slice(2);
    if (raw.startsWith('0') && raw.length === 10) raw = `94${raw.slice(1)}`;
    if (raw.length === 9 && raw.startsWith('7')) raw = `94${raw}`;
    return raw;
  }

  if (global.EHM_SMS?.otp) {
    global.EHM_OTP = global.EHM_SMS.otp;
    return;
  }

  let loadPromise = null;
  const pendingRestores = [];

  function loadSharedService() {
    if (global.EHM_SMS?.otp) return Promise.resolve(global.EHM_SMS.otp);
    if (loadPromise) return loadPromise;

    loadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-ehm-unified-sms]');
      if (existing) {
        const onReady = () => {
          if (!global.EHM_SMS?.otp) return;
          global.removeEventListener('ehm:sms-ready', onReady);
          global.EHM_OTP = global.EHM_SMS.otp;
          for (const args of pendingRestores.splice(0)) {
            global.EHM_SMS.otp.restore(...args);
          }
          resolve(global.EHM_SMS.otp);
        };
        global.addEventListener('ehm:sms-ready', onReady);
        setTimeout(() => {
          if (global.EHM_SMS?.otp) onReady();
        }, 0);
        return;
      }

      const script = document.createElement('script');
      script.src = `/sms-verification-service.js?v=${VERSION}`;
      script.async = false;
      script.dataset.ehmUnifiedSms = 'compat-loader';
      script.onload = () => {
        if (!global.EHM_SMS?.otp) {
          reject(new Error('SMS verification service could not start.'));
          return;
        }
        global.EHM_OTP = global.EHM_SMS.otp;
        for (const args of pendingRestores.splice(0)) {
          global.EHM_SMS.otp.restore(...args);
        }
        resolve(global.EHM_SMS.otp);
      };
      script.onerror = () => reject(new Error('SMS verification service could not be loaded.'));
      document.head.appendChild(script);
    });

    return loadPromise;
  }

  const proxy = {
    normalizePhone,
    validPhone(phone) { return /^947\d{8}$/.test(normalizePhone(phone)); },
    async request(...args) { return (await loadSharedService()).request(...args); },
    async verify(...args) { return (await loadSharedService()).verify(...args); },
    isVerified(...args) {
      return global.EHM_SMS?.otp?.isVerified?.(...args) || false;
    },
    getVerifiedToken(...args) {
      return global.EHM_SMS?.otp?.getVerifiedToken?.(...args) || '';
    },
    restore(...args) {
      if (global.EHM_SMS?.otp) return global.EHM_SMS.otp.restore(...args);
      pendingRestores.push(args);
      loadSharedService().catch(() => {});
      return true;
    },
    reset(...args) {
      if (global.EHM_SMS?.otp) return global.EHM_SMS.otp.reset(...args);
      loadSharedService().then((client) => client.reset(...args)).catch(() => {});
    }
  };

  global.EHM_OTP = proxy;
  loadSharedService().catch((error) => console.error(error));
})(window, document);
