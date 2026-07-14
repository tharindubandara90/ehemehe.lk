(()=>{
  const $ = (id) => document.getElementById(id);

  let settings = null;
  let mode = 'login';
  let loginMethod = 'email';
  let verifyMethod = 'email';
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
            <p class="ehm-auth-muted">Secure access using your email address or mobile number.</p>
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
                <label>Email address</label>
                <input id="ehmRegisterEmail" type="email" autocomplete="email" placeholder="name@example.com">
              </div>

              <div class="ehm-auth-field">
                <label>Mobile number</label>
                <input id="ehmRegisterPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="0771234567">
              </div>

              <div class="ehm-auth-field ehm-auth-full">
                <label>Password</label>
                <input id="ehmRegisterPassword" type="password" autocomplete="new-password" placeholder="Minimum 6 characters">
              </div>
            </div>

            <div class="ehm-verification-box">
              <div class="ehm-verification-title">
                <strong>Choose verification method</strong>
                <span>Your account becomes active only after the OTP is verified.</span>
              </div>

              <div class="ehm-method-tabs ehm-verification-tabs">
                <button type="button" data-verify-method="email">Email OTP</button>
                <button type="button" data-verify-method="sms">SMS OTP</button>
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
    document.querySelectorAll('[data-verify-method]').forEach((button) => {
      button.classList.toggle('active', button.dataset.verifyMethod === verifyMethod);
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
    if (!validEmail(data.email)) return 'Enter a valid email address.';
    if (!validPhone(data.phone)) return 'Enter a valid Sri Lankan mobile number.';
    if (data.password.length < 6) return 'Password must contain at least 6 characters.';
    return '';
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
          method: verifyMethod,
          email: data.email,
          phone: data.phone
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not send the OTP.');

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
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'OTP verification failed.');

      const loginResult = await window.supabaseClient.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });
      if (loginResult.error) throw loginResult.error;

      message('OTP verified. Your account has been created successfully.', true);
      setTimeout(() => { location.href = '/dashboard'; }, 600);
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
      location.href = '/dashboard';
    } catch (error) {
      message(error.message || 'Login failed.');
    } finally {
      setBusy(false);
    }
  }

  async function forgotPassword() {
    const s = await getSettings();
    const identifier = String($('ehmLoginIdentifier')?.value || '').trim();

    if (!identifier) return message('Enter your email or phone number first.');

    const newPassword = prompt('Enter your new password (minimum 6 characters):');
    if (!newPassword || newPassword.length < 6) return message('Password change cancelled or password is too short.');

    try {
      if (loginMethod === 'email') {
        if (!(s.emailOtpEnabled && s.emailPasswordResetOtp)) {
          throw new Error('Email password reset OTP is disabled.');
        }

        const sent = await window.supabaseClient.auth.signInWithOtp({
          email: identifier,
          options: { shouldCreateUser: false }
        });
        if (sent.error) throw sent.error;

        const otp = prompt('Enter the OTP sent to your email:');
        const verified = await window.supabaseClient.auth.verifyOtp({
          email: identifier,
          token: otp,
          type: 'email'
        });
        if (verified.error) throw verified.error;

        const changed = await window.supabaseClient.auth.updateUser({ password: newPassword });
        if (changed.error) throw changed.error;
      } else {
        if (!(s.smsOtpEnabled && s.smsPasswordChangeOtp)) {
          throw new Error('SMS password change OTP is disabled.');
        }

        const sent = await window.EHM_OTP.request(identifier, 'password_reset_phone');
        const otp = prompt('Enter the SMS OTP:');
        const verified = await window.EHM_OTP.verify(
          identifier,
          'password_reset_phone',
          otp,
          sent.verificationId
        );

        const response = await fetch('/api/reset-phone-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: normalizePhone(identifier),
            password: newPassword,
            verifiedToken: verified.verifiedToken
          })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not change the password.');
      }

      message('Password changed successfully.', true);
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

    document.querySelectorAll('[data-verify-method]').forEach((button) => {
      button.onclick = () => {
        verifyMethod = button.dataset.verifyMethod;
        resetOtpState();
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