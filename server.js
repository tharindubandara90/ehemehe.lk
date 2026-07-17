const http = require('http');
const fs = require('fs');
const path = require('path');

loadEnvFile('.env.local');
loadEnvFile('.env');

const publicDir = path.join(__dirname, 'public');
const requestOtp = require('./api/request-otp');
const verifyOtp = require('./api/verify-otp');
const authSettings = require('./api/auth-settings');
const registerPhoneUser = require('./api/register-phone-user');
const resetPhonePassword = require('./api/reset-phone-password');
const registerVerifiedUser = require('./api/register-verified-user');
const requestRegistrationOtp = require('./api/request-registration-otp');
const verifyRegistrationOtp = require('./api/verify-registration-otp');
const loginUser = require('./api/login-user');
const validateAdPhones = require('./api/validate-ad-phones');
const publishAd = require('./api/publish-ad');
const myAds = require('./api/my-ads');
const reportAd = require('./api/report-ad');

function loadEnvFile(file) {
  const p = path.join(__dirname, file);
  if (!fs.existsSync(p)) return;
  const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

function sendFile(res, filePath, requestUrl) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8',
    '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
    '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml'
  };
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404;
      return fs.createReadStream(path.join(publicDir, '404.html')).pipe(res);
    }
    res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
    const assetVersion = requestUrl?.searchParams?.get('v') || '';
    const contentHashedVersion = /^[a-f0-9]{12,64}$/i.test(assetVersion);
    if (ext === '.html') {
      res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
    } else if (contentHashedVersion && ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg'].includes(ext)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (['.js', '.css', '.json'].includes(ext)) {
      // Human-readable/reused version labels must revalidate so a later patch cannot
      // be hidden behind a year-long browser/CDN cache entry.
      res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
    }
    res.end(data);
  });
}

async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const apiRoutes = {
    '/api/request-otp': requestOtp,
    '/api/verify-otp': verifyOtp,
    '/api/auth-settings': authSettings,
    '/api/register-phone-user': registerPhoneUser,
    '/api/reset-phone-password': resetPhonePassword,
    '/api/register-verified-user': registerVerifiedUser,
    '/api/request-registration-otp': requestRegistrationOtp,
    '/api/verify-registration-otp': verifyRegistrationOtp,
    '/api/login-user': loginUser,
    '/api/validate-ad-phones': validateAdPhones,
    '/api/publish-ad': publishAd,
    '/api/my-ads': myAds,
    '/api/report-ad': reportAd
  };

  const apiHandler = apiRoutes[url.pathname];
  if (apiHandler) {
    res.setHeader('Cache-Control', 'no-store');
    return Promise.resolve(apiHandler(req, res)).catch((error) => {
      if (res.writableEnded) return;
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        ok: false,
        message: error?.message || 'Internal API error'
      }));
    });
  }

  if (url.pathname.startsWith('/api/')) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.end(JSON.stringify({
      ok: false,
      message: `API route not found: ${url.pathname}`
    }));
  }

  if (!['GET', 'HEAD'].includes(req.method || 'GET')) {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Allow', 'GET, HEAD');
    return res.end(JSON.stringify({
      ok: false,
      message: `Method ${req.method} is not allowed for ${url.pathname}`
    }));
  }

  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  if (pathname === '/admin' || pathname === '/admin/') pathname = '/admin.html';
  // The React /post route is the source of truth. Preserve old bookmarks and
  // signup return URLs without exposing the competing legacy one-page form.
  if (pathname === '/post-ad' || pathname === '/post-ad/' || pathname === '/post-ad.html') {
    res.statusCode = 308;
    res.setHeader('Location', `/post${url.search || ''}`);
    res.setHeader('Cache-Control', 'no-store');
    return res.end();
  }
  if (pathname === '/browse') pathname = '/browse.html';

  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(publicDir, safePath);
  if (!filePath.startsWith(publicDir)) filePath = path.join(publicDir, '404.html');

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    if (!path.extname(pathname)) filePath = path.join(publicDir, 'index.html');
  }
  return sendFile(res, filePath, url);
}

module.exports = handler;

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  const server = http.createServer((req, res) => {
    Promise.resolve(handler(req, res)).catch((error) => {
      if (res.writableEnded) return;
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        ok: false,
        message: error?.message || 'Internal server error'
      }));
    });
  });

  server.listen(port, () => {
    console.log(`ehemehe.lk local server running at http://localhost:${port}`);
    console.log(`Admin: http://localhost:${port}/admin`);
  });
}
