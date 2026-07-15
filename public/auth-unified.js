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

  let resetStep = 'phone';
  let resetPhone = '';
  let resetVerifiedToken = '';

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

    [
      'ehmMainButton',
      'ehmSendOtp',
      'ehmResetSendOtp',
      'ehmResetVerifyOtp',
      'ehmResetResendOtp',
      'ehmResetUpdatePassword'
    ].forEach((id) => {
      const button = $(id);
      if (button) button.disabled = value;
    });

    const main = $('ehmMainButton');
    if (main) {
      if (value) {
        main.textContent = 'Please wait...';
      } else if (mode === 'login') {
        main.textContent = 'Log in';
      } else if (mode === 'register') {
        main.textContent = otpSent
          ? 'Verify OTP & Create Account'
          : 'Send Verification OTP';
      }
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

  function resetPasswordState() {
    resetStep = 'phone';
    resetPhone = '';
    resetVerifiedToken = '';
    try { window.EHM_OTP?.reset?.('password_reset_phone'); } catch (_) {}

    ['ehmResetPhone', 'ehmResetOtp', 'ehmResetPassword', 'ehmResetPasswordConfirm']
      .forEach((id) => {
        const input = $(id);
        if (input) input.value = '';
      });
  }

  function shell() {
    return `
      <main class="ehm-auth-page">
        <section class="ehm-auth-card">
          <div class="ehm-auth-heading">
            <span class="ehm-auth-eyebrow">EheMehe.lk Account</span>
            <h1 id="ehmAuthTitle">Welcome back</h1>
            <p id="ehmAuthSubtitle" class="ehm-auth-muted">Secure access to your account.</p>
          </div>

          <div id="ehmAuthTabs" class="ehm-auth-tabs">
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

          <section id="ehmResetFields" class="ehm-hidden">
            <div class="ehm-reset-progress" aria-label="Password reset progress">
              <div data-reset-progress="phone"><span>1</span><small>Phone</small></div>
              <i></i>
              <div data-reset-progress="otp"><span>2</span><small>Verify OTP</small></div>
              <i></i>
              <div data-reset-progress="password"><span>3</span><small>New password</small></div>
            </div>

            <div id="ehmResetPhoneStep" class="ehm-reset-step">
              <div class="ehm-reset-info">
                <strong>Verify your registered mobile number</strong>
                <span>We will send a 6-digit SMS code before allowing a password change.</span>
              </div>
              <div class="ehm-auth-field">
                <label>Registered mobile number</label>
                <input id="ehmResetPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="0771234567">
              </div>
              <button id="ehmResetSendOtp" class="ehm-auth-btn" type="button">Send SMS OTP</button>
            </div>

            <div id="ehmResetOtpStep" class="ehm-reset-step ehm-hidden">
              <div class="ehm-reset-info">
                <strong>Enter the SMS OTP</strong>
                <span id="ehmResetDestination">A 6-digit code was sent to your phone.</span>
              </div>
              <div class="ehm-auth-field">
                <label>Verification OTP</label>
                <input id="ehmResetOtp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="Enter 6-digit code">
              </div>
              <button id="ehmResetVerifyOtp" class="ehm-auth-btn" type="button">Verify OTP</button>
              <div class="ehm-reset-actions">
                <button id="ehmResetResendOtp" class="ehm-auth-link" type="button">Resend OTP</button>
                <button id="ehmResetChangePhone" class="ehm-auth-link" type="button">Change number</button>
              </div>
            </div>

            <div id="ehmResetPasswordStep" class="ehm-reset-step ehm-hidden">
              <div class="ehm-reset-verified">
                <span>✓</span>
                <div>
                  <strong>Phone number verified</strong>
                  <small>You can now set a new password.</small>
                </div>
              </div>
              <div class="ehm-auth-field">
                <label>New password</label>
                <input id="ehmResetPassword" type="password" autocomplete="new-password" placeholder="Minimum 6 characters">
              </div>
              <div class="ehm-auth-field">
                <label>Confirm new password</label>
                <input id="ehmResetPasswordConfirm" type="password" autocomplete="new-password" placeholder="Enter the password again">
              </div>
              <button id="ehmResetUpdatePassword" class="ehm-auth-btn" type="button">Update Password</button>
            </div>

            <button id="ehmResetBack" class="ehm-auth-link ehm-reset-back" type="button">← Back to login</button>
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

    const isReset = mode === 'reset';
    $('ehmAuthTabs')?.classList.toggle('ehm-hidden', isReset);
    $('ehmLoginFields')?.classList.toggle('ehm-hidden', mode !== 'login');
    $('ehmRegisterFields')?.classList.toggle('ehm-hidden', mode !== 'register');
    $('ehmResetFields')?.classList.toggle('ehm-hidden', !isReset);
    $('ehmForgot')?.classList.toggle('ehm-hidden', mode !== 'login');
    $('ehmMainButton')?.classList.toggle('ehm-hidden', isReset);
    $('ehmOtpWrap')?.classList.toggle('ehm-hidden', mode !== 'register' || !otpSent);

    const title = $('ehmAuthTitle');
    const subtitle = $('ehmAuthSubtitle');
    if (title && subtitle) {
      if (mode === 'register') {
        title.textContent = 'Create your account';
        subtitle.textContent = 'Create and secure your account using SMS verification.';
      } else if (mode === 'reset') {
        title.textContent = 'Reset your password';
        subtitle.textContent = 'SMS verification is required before a new password can be set.';
      } else {
        title.textContent = 'Welcome back';
        subtitle.textContent = 'Log in using your email address or phone number.';
      }
    }

    const loginIdentifier = $('ehmLoginIdentifier');
    if (loginIdentifier) {
      loginIdentifier.type = loginMethod === 'email' ? 'email' : 'tel';
      loginIdentifier.placeholder = loginMethod === 'email' ? 'name@example.com' : '0771234567';
    }
    if ($('ehmLoginIdentifierLabel')) {
      $('ehmLoginIdentifierLabel').textContent = loginMethod === 'email'
        ? 'Email address'
        : 'Mobile number';
    }

    const main = $('ehmMainButton');
    if (main && !busy) {
      main.textContent =
        mode === 'login'
          ? 'Log in'
          : otpSent
            ? 'Verify OTP & Create Account'
            : 'Send Verification OTP';
    }

    if (isReset) {
      $('ehmResetPhoneStep')?.classList.toggle('ehm-hidden', resetStep !== 'phone');
      $('ehmResetOtpStep')?.classList.toggle('ehm-hidden', resetStep !== 'otp');
      $('ehmResetPasswordStep')?.classList.toggle('ehm-hidden', resetStep !== 'password');

      const order = { phone: 0, otp: 1, password: 2 };
      document.querySelectorAll('[data-reset-progress]').forEach((node) => {
        const nodeStep = node.dataset.resetProgress;
        const active = order[nodeStep] === order[resetStep];
        const complete = order[nodeStep] < order[resetStep];
        node.classList.toggle('active', active);
        node.classList.toggle('complete', complete);
      });
    }

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

  async function installServerSession(session) {
    if (!session?.access_token || !session?.refresh_token) {
      throw new Error('The server did not return a valid login session.');
    }
    const client = window.supabaseClient || await window.waitForSupabaseClient?.();
    if (!client?.auth) throw new Error('Supabase client is not ready.');
    const result = await client.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token
    });
    if (result.error) throw result.error;
    return result.data?.session;
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

      await installServerSession(result.session);

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
      const response = await fetch('/api/login-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const result = await readApiResponse(response);
      if (!response.ok || result.ok === false) {
        throw new Error(result.message || `Login failed (HTTP ${response.status}).`);
      }
      await installServerSession(result.session);
      location.href = safeReturnTarget();
    } catch (error) {
      message(error.message || 'Login failed.');
    } finally {
      setBusy(false);
    }
  }

  function openPasswordReset() {
    const loginValue = String($('ehmLoginIdentifier')?.value || '').trim();

    resetPasswordState();
    mode = 'reset';

    if (loginMethod === 'phone' && validPhone(loginValue)) {
      resetPhone = normalizePhone(loginValue);
    }

    render();

    const phoneInput = $('ehmResetPhone');
    if (phoneInput) {
      phoneInput.value = resetPhone ? `0${resetPhone.slice(2)}` : '';
      setTimeout(() => phoneInput.focus(), 0);
    }
  }

  function returnToLogin(successText = '') {
    const verifiedPhone = resetPhone;
    resetPasswordState();
    mode = 'login';
    loginMethod = 'phone';
    render();

    const loginInput = $('ehmLoginIdentifier');
    if (loginInput && verifiedPhone) {
      loginInput.value = `0${verifiedPhone.slice(2)}`;
    }
    const passwordInput = $('ehmLoginPassword');
    if (passwordInput) passwordInput.value = '';

    if (successText) message(successText, true);
  }

  async function sendPasswordResetOtp() {
    const s = await getSettings();
    const entered = String($('ehmResetPhone')?.value || '').trim();
    const phone = normalizePhone(entered);

    if (!validPhone(phone)) {
      return message('Enter a valid Sri Lankan mobile number.');
    }
    if (!(s.smsOtpEnabled && s.smsPasswordChangeOtp)) {
      return message('SMS password reset is currently unavailable.');
    }

    setBusy(true);
    try {
      window.EHM_OTP?.reset?.('password_reset_phone');
      const sent = await window.EHM_OTP.request(phone, 'password_reset_phone');

      resetPhone = phone;
      resetVerifiedToken = '';
      resetStep = 'otp';
      render();

      const destination = $('ehmResetDestination');
      if (destination) {
        destination.textContent = `A 6-digit code was sent to 0${phone.slice(2, 5)}***${phone.slice(-3)}.`;
      }

      message(sent.message || 'SMS OTP sent successfully.', true);
      setTimeout(() => $('ehmResetOtp')?.focus(), 0);
    } catch (error) {
      message(error.message || 'Could not send the SMS OTP.');
    } finally {
      setBusy(false);
    }
  }

  async function verifyPasswordResetOtp() {
    const otp = String($('ehmResetOtp')?.value || '').trim();

    if (!resetPhone || !validPhone(resetPhone)) {
      resetStep = 'phone';
      render();
      return message('Enter your mobile number and request a new OTP.');
    }
    if (!/^\d{6}$/.test(otp)) {
      return message('Enter the 6-digit OTP code.');
    }

    setBusy(true);
    try {
      const verified = await window.EHM_OTP.verify(
        resetPhone,
        'password_reset_phone',
        otp
      );

      if (!verified.verifiedToken) {
        throw new Error('The server did not return a valid verification token.');
      }

      resetVerifiedToken = verified.verifiedToken;
      resetStep = 'password';
      render();
      message('Phone number verified. Enter your new password.', true);
      setTimeout(() => $('ehmResetPassword')?.focus(), 0);
    } catch (error) {
      message(error.message || 'OTP verification failed.');
    } finally {
      setBusy(false);
    }
  }

  async function updateResetPassword() {
    const password = String($('ehmResetPassword')?.value || '');
    const confirmation = String($('ehmResetPasswordConfirm')?.value || '');

    if (!resetVerifiedToken || resetStep !== 'password') {
      return message('Verify the SMS OTP before setting a new password.');
    }
    if (password.length < 6) {
      return message('New password must contain at least 6 characters.');
    }
    if (password !== confirmation) {
      return message('The two passwords do not match.');
    }

    setBusy(true);
    try {
      const response = await fetch('/api/reset-phone-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          phone: resetPhone,
          password,
          verifiedToken: resetVerifiedToken
        })
      });

      const result = await readApiResponse(response);
      if (!response.ok || result.ok === false) {
        throw new Error(result.message || `Could not change the password (HTTP ${response.status}).`);
      }

      returnToLogin('Password updated successfully. Log in using your new password.');
    } catch (error) {
      message(error.message || 'Could not update the password.');
    } finally {
      setBusy(false);
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

    $('ehmForgot').onclick = openPasswordReset;
    $('ehmResetSendOtp').onclick = sendPasswordResetOtp;
    $('ehmResetVerifyOtp').onclick = verifyPasswordResetOtp;
    $('ehmResetResendOtp').onclick = sendPasswordResetOtp;
    $('ehmResetUpdatePassword').onclick = updateResetPassword;
    $('ehmResetChangePhone').onclick = () => {
      resetPasswordState();
      mode = 'reset';
      render();
      setTimeout(() => $('ehmResetPhone')?.focus(), 0);
    };
    $('ehmResetBack').onclick = () => returnToLogin();

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();