const fs = require('fs');
const path = require('path');

const root = __dirname;
const authPath = path.join(root, 'public', 'auth-unified.js');
const loginHandlerPath = path.join(root, 'api-handlers', 'login-user.js');
const otpUtilsPath = path.join(root, 'lib', 'otp-utils.js');

const auth = fs.readFileSync(authPath, 'utf8');
const loginHandler = fs.readFileSync(loginHandlerPath, 'utf8');
const otpUtils = fs.readFileSync(otpUtilsPath, 'utf8');

if (/data-login-method=/.test(auth)) {
  throw new Error('Email/phone login method buttons are still present.');
}
if (!/Email address or phone number/.test(auth)) {
  throw new Error('Combined login identifier label is missing.');
}
if (!/name@example\.com or 0771234567/.test(auth)) {
  throw new Error('Combined login identifier placeholder is missing.');
}
if (!/body\.identifier/.test(loginHandler) || !/findAuthUserByIdentifier\(identifier\)/.test(loginHandler)) {
  throw new Error('Login API is not using a single generic identifier.');
}
if (!/isSriLankaMobile\(phone\).*findAuthUserByPhone\(phone\)/s.test(otpUtils)) {
  throw new Error('Phone auto-detection is missing in identifier lookup.');
}
if (!/isValidEmail\(email\).*findAuthUserByEmail\(email\)/s.test(otpUtils)) {
  throw new Error('Email auto-detection is missing in identifier lookup.');
}

console.log('LOGIN_AUTO_IDENTIFIER_UI_REGRESSION_TEST_PASSED');
