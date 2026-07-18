const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

loadEnvFile('.env.local');
loadEnvFile('.env');

const publicDir = path.join(__dirname, 'public');
const requestOtp = require('./server-routes/request-otp');
const verifyOtp = require('./server-routes/verify-otp');
const authSettings = require('./server-routes/auth-settings');
const registerPhoneUser = require('./server-routes/register-phone-user');
const resetPhonePassword = require('./server-routes/reset-phone-password');
const registerVerifiedUser = require('./server-routes/register-verified-user');
const requestRegistrationOtp = require('./server-routes/request-registration-otp');
const verifyRegistrationOtp = require('./server-routes/verify-registration-otp');
const loginUser = require('./server-routes/login-user');
const validateAdPhones = require('./server-routes/validate-ad-phones');
const publishAd = require('./server-routes/publish-ad');
const myAds = require('./server-routes/my-ads');
const reportAd = require('./server-routes/report-ad');
const publicHome = require('./server-routes/public-home');
const publicMeta = require('./server-routes/public-meta');
const publicAd = require('./server-routes/public-ad');
const publicAdImage = require('./server-routes/public-ad-image');

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

function sendFile(req, res, filePath, requestUrl) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8',
    '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
    '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml',
    '.webp':'image/webp', '.avif':'image/avif', '.ico':'image/x-icon',
    '.woff':'font/woff', '.woff2':'font/woff2'
  };

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404;
      const notFound = path.join(publicDir, '404.html');
      return fs.createReadStream(notFound).pipe(res);
    }

    const etag = `"${crypto.createHash('sha1').update(data).digest('hex')}"`;
    res.setHeader('ETag', etag);
    if (req.headers['if-none-match'] === etag) {
      res.statusCode = 304;
      return res.end();
    }

    res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
    const assetVersion = requestUrl?.searchParams?.get('v') || '';
    const contentHashedVersion = /^[a-f0-9]{12,64}$/i.test(assetVersion);
    if (ext === '.html') {
      res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
    } else if (contentHashedVersion && ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.avif', '.woff', '.woff2'].includes(ext)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (['.js', '.css', '.json'].includes(ext)) {
      res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
    } else if (['.png', '.jpg', '.jpeg', '.svg', '.webp', '.avif', '.ico', '.woff', '.woff2'].includes(ext)) {
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    }

    if ((req.method || 'GET') === 'HEAD') return res.end();

    const compressible = ['.html', '.js', '.css', '.json', '.svg'].includes(ext) && data.length >= 1024;
    const acceptEncoding = String(req.headers['accept-encoding'] || '');
    if (compressible && /\bbr\b/.test(acceptEncoding)) {
      res.setHeader('Content-Encoding', 'br');
      res.setHeader('Vary', 'Accept-Encoding');
      return zlib.brotliCompress(data, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }, (zipError, output) => {
        if (zipError) {
          res.removeHeader('Content-Encoding');
          res.setHeader('Content-Length', String(data.length));
          return res.end(data);
        }
        res.setHeader('Content-Length', String(output.length));
        res.end(output);
      });
    }
    if (compressible && /\bgzip\b/.test(acceptEncoding)) {
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Vary', 'Accept-Encoding');
      return zlib.gzip(data, { level: 6 }, (zipError, output) => {
        if (zipError) {
          res.removeHeader('Content-Encoding');
          res.setHeader('Content-Length', String(data.length));
          return res.end(data);
        }
        res.setHeader('Content-Length', String(output.length));
        res.end(output);
      });
    }

    res.setHeader('Content-Length', String(data.length));
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
    '/api/report-ad': reportAd,
    '/api/public-home': publicHome,
    '/api/public-meta': publicMeta,
    '/api/public-ad': publicAd,
    '/api/public-ad-image': publicAdImage
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
  return sendFile(req, res, filePath, url);
}

module.exports = handler;

// Vercel detects a root Node HTTP server only when server.listen() is called
// during module startup. Keep one captured server for every API route; static
// files under public/** continue to be served by Vercel's CDN.
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
  if (!process.env.VERCEL) {
    console.log(`ehemehe.lk local server running at http://localhost:${port}`);
    console.log(`Admin: http://localhost:${port}/admin`);
  }
});

module.exports.server = server;
