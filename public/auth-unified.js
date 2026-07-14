(()=>{
  const $ = (id) => document.getElementById(id);

  function isAuthRoutePath(pathname) {
    const path = String(pathname || '').replace(/\/+$/, '') || '/';
    return path === '/login' || path === '/signup';
  }

  function safeReturnTarget() {
    try {
      const requested = new URLSearchParams(location.search).get('return') || '';
      if (requested.startsWith('/') && !requested.startsWith('//')) return requested;
    } catch (_) {}
    return '/dashboard';
  }

  function installHardAuthNavigation() {
    if (window.__ehmHardAuthNavigationInstalled) return;
    window.__ehmHardAuthNavigationInstalled = true;

    document.addEventListener('click', (event) => {
      const link = event.target?.closest?.('a[href]');
      if (!link) return;

      let url;
      try { url = new URL(link.href, location.href); }
      catch (_) { return; }

      if (url.origin !== location.origin || !isAuthRoutePath(url.pathname)) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      location.assign(url.pathname + url.search + url.hash);
    }, true);

    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    history.pushState = function () {
      const result = originalPushState(...arguments);
      if (isAuthRoutePath(location.pathname)) location.reload();
      return result;
    };

    history.replaceState = function () {
      const result = originalReplaceState(...arguments);
      if (isAuthRoutePath(location.pathname) && !window.__EHM_AUTH_ONLY_ROUTE) location.reload();
      return result;
    };
  }

  installHardAuthNavigation();

  let settings = null;
  let mode = 'login';
  let loginMethod = 'email';
  const verifyMethod = 'sms';
  let registrationChallenge = '';
  let smsVerificationId = '';
  let smsVerifiedToken = '';
  let otpSent = false;
  let busy = false;

  const normalizePhone = (value) => {
    if (window.EHM_OTP) return EHM_OTP.normalizePhone(value);
    let raw = String(value || '').replace(/[^\d+]/g, '');
    if (raw.startsWith('+')) raw = raw.slice(1);
    if (raw.startsWith('0') && raw.length === 10) raw = '94' + raw.slice(1);
    if (raw.length === 9 && raw.startsWith('7')) raw = '94' + raw;
    return raw;
  };

  const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  const validPhone = (value) => /^947\d{8}$/.test(normalizePhone(value));

  async function getSettings() {
    if (settings) return settings;
    try {
      const response = await fetch('/api/auth-settings', { cache: 'no-store' });
      const data = await response.json();
      settings = data.settings || {};
    } catch (_) {
      settings = {
        emailOtpEnabled: true,
        emailRegisterOtp: true,
        emailPasswordResetOtp: true,
        smsOtpEnabled: true,
        smsRegisterOtp: true,
        smsPasswordChangeOtp: true,
        smsAdPhoneOtp: true
      };
    }
    window.EHM_AUTH_SETTINGS = settings;
    return settings;
  }

  function message(text, ok = false) {
    const node = $('ehmAuthMessage');
    if (!node) return;
    node.textContent = text || '';
    node.className = 'ehm-auth-message' + (ok ? ' ok' : '');
  }

  function setBusy(value) {
    busy = value;
    ['ehmMainButton', 'ehmSendOtp'].forEach((id) => {
      const button = $(id);
      if (button) button.disabled = value;
    });
    const main = $('ehmMainButton');
    if (main) {
      main.textContent = value
        ? 'Please wait...'
        : mode === 'login'
          ? 'Log in'
          : otpSent
            ? 'Verify OTP & Create Account'
            : 'Send Verification OTP';
    }
  }

  function resetOtpState() {
    otpSent = false;
    registrationChallenge = '';
    smsVerificationId = '';
    smsVerifiedToken = '';
    const otp = $('ehmOtp');
    if (otp) otp.value = '';
  }

  function shell() {
    return `
      <main class="ehm-auth-page">
        <section class="ehm-auth-card">
          <div class="ehm-auth-heading">
            <span class="ehm-auth-eyebrow">EheMehe.lk Account</span>
            <h1>${location.pathname.startsWith('/signup') ? 'Create your account' : 'Welcome back'}</h1>
            <p class="ehm-auth-muted">Create and secure your account using SMS verification.</p>
          </div>

          <div class="ehm-auth-tabs">
            <button type="button" data-auth-mode="login">Log in</button>
            <button type="button" data-auth-mode="register">Create account</button>
          </div>

          <section id="ehmLoginFields">
            <div class="ehm-method-tabs">
              <button type="button" data-login-method="email">Email</button>
              <button type="button" data-login-method="phone">Phone number</button>
            </div>

            <div class="ehm-auth-field">
              <label id="ehmLoginIdentifierLabel">Email</label>
              <input id="ehmLoginIdentifier" autocomplete="username">
            </div>

            <div class="ehm-auth-field">
              <label>Password</label>
              <input id="ehmLoginPassword" type="password" autocomplete="current-password">
            </div>
          </section>

          <section id="ehmRegisterFields">
            <div class="ehm-auth-grid">
              <div class="ehm-auth-field ehm-auth-full">
                <label>Full name</label>
                <input id="ehmName" autocomplete="name" placeholder="Your full name">
              </div>

              <div class="ehm-auth-field">
                <label>Mobile number <span class="ehm-required">*</span></label>
                <input id="ehmRegisterPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="0771234567">
              </div>

              <div class="ehm-auth-field">
                <label>Email address <span class="ehm-optional">(optional)</span></label>
                <input id="ehmRegisterEmail" type="email" autocomplete="email" placeholder="name@example.com">
              </div>

              <div class="ehm-auth-field ehm-auth-full">
                <label>Password</label>
                <input id="ehmRegisterPassword" type="password" autocomplete="new-password" placeholder="Minimum 6 characters">
              </div>
            </div>

            <div class="ehm-verification-box">
              <div class="ehm-verification-title">
                <strong>SMS phone verification</strong>
                <span>A 6-digit OTP will be sent to the mobile number above. The account is created only after the correct OTP is entered.</span>
              </div>

              <div id="ehmOtpWrap" class="ehm-auth-field ehm-hidden">
                <label>Verification OTP</label>
                <div class="ehm-auth-row">
                  <input id="ehmOtp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="Enter 6-digit code">
                  <button id="ehmSendOtp" class="ehm-auth-secondary" type="button">Resend OTP</button>
                </div>
              </div>
            </div>
          </section>

          <button id="ehmMainButton" class="ehm-auth-btn" type="button">Continue</button>
          <button id="ehmForgot" class="ehm-auth-link" type="button">Forgot password?</button>
          <div id="ehmAuthMessage" class="ehm-auth-message" aria-live="polite"></div>
        </section>
      </main>
    `;
  }

  function render() {
    document.querySelectorAll('[data-auth-mode]').forEach((button) => {
      button.classList.toggle('active', button.dataset.authMode === mode);
    });
    document.querySelectorAll('[data-login-method]').forEach((button) => {
      button.classList.toggle('active', button.dataset.loginMethod === loginMethod);
    });

    $('ehmLoginFields')?.classList.toggle('ehm-hidden', mode !== 'login');
    $('ehmRegisterFields')?.classList.toggle('ehm-hidden', mode !== 'register');
    $('ehmForgot')?.classList.toggle('ehm-hidden', mode !== 'login');
    $('ehmOtpWrap')?.classList.toggle('ehm-hidden', mode !== 'register' || !otpSent);

    const loginIdentifier = $('ehmLoginIdentifier');
    if (loginIdentifier) {
      loginIdentifier.type = loginMethod === 'email' ? 'email' : 'tel';
      loginIdentifier.placeholder = loginMethod === 'email' ? 'name@example.com' : '0771234567';
    }
    if ($('ehmLoginIdentifierLabel')) {
      $('ehmLoginIdentifierLabel').textContent = loginMethod === 'email' ? 'Email address' : 'Mobile number';
    }

    $('ehmMainButton').textContent =
      mode === 'login'
        ? 'Log in'
        : otpSent
          ? 'Verify OTP & Create Account'
          : 'Send Verification OTP';

    message('');
  }

  function readRegistration() {
    return {
      name: String($('ehmName')?.value || '').trim(),
      email: String($('ehmRegisterEmail')?.value || '').trim().toLowerCase(),
      phone: normalizePhone($('ehmRegisterPhone')?.value || ''),
      password: String($('ehmRegisterPassword')?.value || '')
    };
  }

  function validateRegistration(data) {
    if (data.name.length < 2) return 'Enter your full name.';
    if (data.email && !validEmail(data.email)) return 'Enter a valid email address or leave it blank.';
    if (!validPhone(data.phone)) return 'Enter a valid Sri Lankan mobile number.';
    if (data.password.length < 6) return 'Password must contain at least 6 characters.';
    return '';
  }

  async function readApiResponse(response) {
    const text = await response.text();
    if (!text) {
      return {
        ok: false,
        message: `Empty response from server (HTTP ${response.status}).`
      };
    }

    try {
      return JSON.parse(text);
    } catch (_) {
      return {
        ok: false,
        message: `Server returned a non-JSON response (HTTP ${response.status}).`
      };
    }
  }

  async function sendRegistrationOtp() {
    const data = readRegistration();
    const validationError = validateRegistration(data);
    if (validationError) return message(validationError);

    resetOtpState();
    setBusy(true);

    try {
      const response = await fetch('/api/request-registration-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: data.phone,
          email: data.email
        })
      });
      const result = await readApiResponse(response);
      if (!response.ok || result.ok === false) throw new Error(result.message || `Could not send the OTP (HTTP ${response.status}).`);

      registrationChallenge = result.challenge || '';
      otpSent = true;
      render();
      message(`OTP sent to ${result.destination}. Enter it to create the account.`, true);
    } catch (error) {
      message(error.message || 'Could not send the OTP.');
    } finally {
      setBusy(false);
    }
  }

  async function verifyAndCreateAccount() {
    const data = readRegistration();
    const validationError = validateRegistration(data);
    if (validationError) return message(validationError);

    const otp = String($('ehmOtp')?.value || '').trim();
    if (!/^\d{6}$/.test(otp)) return message('Enter the 6-digit OTP code.');
    if (!registrationChallenge) return message('Request a new OTP first.');

    setBusy(true);

    try {
      const response = await fetch('/api/verify-registration-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge: registrationChallenge,
          code: otp,
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password
        })
      });
      const result = await readApiResponse(response);
      if (!response.ok || result.ok === false) throw new Error(result.message || `OTP verification failed (HTTP ${response.status}).`);

      const loginResult = await window.supabaseClient.auth.signInWithPassword({
        phone: '+' + data.phone,
        password: data.password
      });
      if (loginResult.error) throw loginResult.error;

      message('OTP verified. Your account has been created successfully.', true);
      setTimeout(() => { location.href = safeReturnTarget(); }, 600);
    } catch (error) {
      message(error.message || 'OTP verification failed.');
    } finally {
      setBusy(false);
    }
  }

  async function login() {
    const identifier = String($('ehmLoginIdentifier')?.value || '').trim();
    const password = String($('ehmLoginPassword')?.value || '');

    if (!identifier || password.length < 6) {
      return message('Enter your login details correctly.');
    }

    setBusy(true);
    try {
      const credentials =
        loginMethod === 'email'
          ? { email: identifier.toLowerCase(), password }
          : { phone: '+' + normalizePhone(identifier), password };

      const result = await window.supabaseClient.auth.signInWithPassword(credentials);
      if (result.error) throw result.error;
      location.href = safeReturnTarget();
    } catch (error) {
      message(error.message || 'Login failed.');
    } finally {
      setBusy(false);
    }
  }

  async function forgotPassword() {
    const s = await getSettings();
    const entered = String($('ehmLoginIdentifier')?.value || '').trim();

    if (loginMethod !== 'phone') {
      loginMethod = 'phone';
      render();
      return message('Password reset uses SMS OTP. Enter your mobile number.');
    }

    if (!validPhone(entered)) {
      return message('Enter a valid Sri Lankan mobile number.');
    }
    if (!(s.smsOtpEnabled && s.smsPasswordChangeOtp)) {
      return message('SMS password reset is currently disabled.');
    }

    const newPassword = prompt('Enter your new password (minimum 6 characters):');
    if (!newPassword || newPassword.length < 6) {
      return message('Password change cancelled or password is too short.');
    }

    try {
      const sent = await window.EHM_OTP.request(entered, 'password_reset_phone');
      const otp = prompt('Enter the SMS OTP sent to your phone:');
      if (!otp) return message('Password reset cancelled.');

      const verified = await window.EHM_OTP.verify(
        entered,
        'password_reset_phone',
        otp,
        sent.verificationId
      );

      const response = await fetch('/api/reset-phone-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizePhone(entered),
          password: newPassword,
          verifiedToken: verified.verifiedToken
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not change the password.');

      message('Password changed successfully. You can now log in with your phone number.', true);
    } catch (error) {
      message(error.message || 'Password reset failed.');
    }
  }

  async function mount() {
    const path = location.pathname.replace(/\/$/, '');
    if (!['/login', '/signup'].includes(path)) return;

    await getSettings();

    const root = document.getElementById('root');
    if (!root) return;

    root.innerHTML = shell();
    mode = path === '/signup' ? 'register' : 'login';

    document.querySelectorAll('[data-auth-mode]').forEach((button) => {
      button.onclick = () => {
        mode = button.dataset.authMode;
        resetOtpState();
        render();
      };
    });

    document.querySelectorAll('[data-login-method]').forEach((button) => {
      button.onclick = () => {
        loginMethod = button.dataset.loginMethod;
        render();
      };
    });


    $('ehmSendOtp').onclick = sendRegistrationOtp;
    $('ehmMainButton').onclick = () => {
      if (busy) return;
      if (mode === 'login') return login();
      return otpSent ? verifyAndCreateAccount() : sendRegistrationOtp();
    };
    $('ehmForgot').onclick = forgotPassword;

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();