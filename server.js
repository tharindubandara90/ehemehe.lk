const http = require('http');
const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const publicDir = [
  path.join(projectRoot, 'public'),
  path.join(__dirname, 'public'),
  path.join(__dirname, '..', 'public')
].find((candidate) => fs.existsSync(candidate)) || path.join(projectRoot, 'public');

loadEnvFile('.env.local');
loadEnvFile('.env');

// Load each API only when its route is called. A problem in one optional API
// must never prevent the home page or the rest of the marketplace from loading.
const apiRouteLoaders = Object.freeze({
  '/api/request-otp': () => require('./api/request-otp'),
  '/api/verify-otp': () => require('./api/verify-otp'),
  '/api/auth-settings': () => require('./api/auth-settings'),
  '/api/register-phone-user': () => require('./api/register-phone-user'),
  '/api/reset-phone-password': () => require('./api/reset-phone-password'),
  '/api/register-verified-user': () => require('./api/register-verified-user'),
  '/api/request-registration-otp': () => require('./api/request-registration-otp'),
  '/api/verify-registration-otp': () => require('./api/verify-registration-otp'),
  '/api/login-user': () => require('./api/login-user'),
  '/api/validate-ad-phones': () => require('./api/validate-ad-phones'),
  '/api/publish-ad': () => require('./api/publish-ad'),
  '/api/my-ads': () => require('./api/my-ads'),
  '/api/update-my-ad': () => require('./api/update-my-ad'),
  '/api/report-ad': () => require('./api/report-ad')
});
const apiHandlerCache = new Map();

function loadEnvFile(file) {
  const candidates = [
    path.join(projectRoot, file),
    path.join(__dirname, file)
  ];
  const p = candidates.find((candidate) => fs.existsSync(candidate));
  if (!p) return;
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

function apiHandlerFor(pathname) {
  if (apiHandlerCache.has(pathname)) return apiHandlerCache.get(pathname);
  const loader = apiRouteLoaders[pathname];
  if (!loader) return null;
  const handler = loader();
  if (typeof handler !== 'function') throw new Error(`Invalid API handler for ${pathname}`);
  apiHandlerCache.set(pathname, handler);
  return handler;
}

function endJson(res, status, body) {
  if (res.writableEnded) return;
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function safe404(res) {
  const notFoundPath = path.join(publicDir, '404.html');
  if (fs.existsSync(notFoundPath)) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
    return fs.createReadStream(notFoundPath)
      .on('error', () => endJson(res, 404, { ok: false, message: 'Page not found.' }))
      .pipe(res);
  }
  return endJson(res, 404, { ok: false, message: 'Page not found.' });
}

function sendFile(res, filePath, requestUrl) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8',
    '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
    '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml',
    '.webp':'image/webp', '.ico':'image/x-icon', '.woff':'font/woff', '.woff2':'font/woff2'
  };
  fs.readFile(filePath, (err, data) => {
    if (err) return safe404(res);
    res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
    const assetVersion = requestUrl?.searchParams?.get('v') || '';
    const contentHashedVersion = /^[a-f0-9]{12,64}$/i.test(assetVersion);
    if (ext === '.html') {
      res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
    } else if (contentHashedVersion && ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.woff', '.woff2'].includes(ext)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (['.js', '.css', '.json'].includes(ext)) {
      res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
    }
    res.end(data);
  });
}

async function handler(req, res) {
  let url;
  try {
    url = new URL(req.url || '/', 'http://localhost');
  } catch (_) {
    return endJson(res, 400, { ok: false, message: 'Invalid request URL.' });
  }

  if (apiRouteLoaders[url.pathname]) {
    res.setHeader('Cache-Control', 'no-store');
    let apiHandler;
    try {
      apiHandler = apiHandlerFor(url.pathname);
    } catch (error) {
      console.error(`API startup failed for ${url.pathname}:`, error);
      return endJson(res, 500, {
        ok: false,
        message: 'This service is temporarily unavailable. Please try again.'
      });
    }
    return Promise.resolve(apiHandler(req, res)).catch((error) => {
      console.error(`API request failed for ${url.pathname}:`, error);
      return endJson(res, 500, {
        ok: false,
        message: error?.message || 'Internal API error'
      });
    });
  }

  if (url.pathname.startsWith('/api/')) {
    return endJson(res, 404, {
      ok: false,
      message: `API route not found: ${url.pathname}`
    });
  }

  if (!['GET', 'HEAD'].includes(req.method || 'GET')) {
    res.setHeader('Allow', 'GET, HEAD');
    return endJson(res, 405, {
      ok: false,
      message: `Method ${req.method} is not allowed for ${url.pathname}`
    });
  }

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch (_) {
    return endJson(res, 400, { ok: false, message: 'Invalid URL encoding.' });
  }

  if (pathname === '/') pathname = '/index.html';
  if (pathname === '/admin' || pathname === '/admin/') pathname = '/admin.html';
  if (pathname === '/post-ad' || pathname === '/post-ad/' || pathname === '/post-ad.html') {
    res.statusCode = 308;
    res.setHeader('Location', `/post${url.search || ''}`);
    res.setHeader('Cache-Control', 'no-store');
    return res.end();
  }
  if (pathname === '/browse') pathname = '/browse.html';

  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(publicDir, safePath);
  if (!filePath.startsWith(publicDir)) filePath = path.join(publicDir, '404.html');

  try {
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      if (!path.extname(pathname)) filePath = path.join(publicDir, 'index.html');
    }
  } catch (error) {
    console.error('Static route resolution failed:', error);
    filePath = path.join(publicDir, 'index.html');
  }

  if (req.method === 'HEAD') {
    if (!fs.existsSync(filePath)) return safe404(res);
    res.statusCode = 200;
    res.setHeader('Cache-Control', path.extname(filePath) === '.html' ? 'no-cache, max-age=0, must-revalidate' : 'public, max-age=300');
    return res.end();
  }

  return sendFile(res, filePath, url);
}

module.exports = handler;

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  const server = http.createServer((req, res) => {
    Promise.resolve(handler(req, res)).catch((error) => {
      console.error('Unhandled local server error:', error);
      endJson(res, 500, {
        ok: false,
        message: error?.message || 'Internal server error'
      });
    });
  });

  server.listen(port, () => {
    console.log(`ehemehe.lk local server running at http://localhost:${port}`);
    console.log(`Admin: http://localhost:${port}/admin`);
  });
}
