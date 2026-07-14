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

function sendFile(res, filePath) {
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
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/request-otp') return requestOtp(req, res);
  if (url.pathname === '/api/verify-otp') return verifyOtp(req, res);
  if (url.pathname === '/api/auth-settings') return authSettings(req, res);
  if (url.pathname === '/api/register-phone-user') return registerPhoneUser(req, res);
  if (url.pathname === '/api/reset-phone-password') return resetPhonePassword(req, res);

  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  if (pathname === '/admin' || pathname === '/admin/') pathname = '/admin.html';
  if (pathname === '/post-ad') pathname = '/post-ad.html';
  if (pathname === '/browse') pathname = '/browse.html';

  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(publicDir, safePath);
  if (!filePath.startsWith(publicDir)) filePath = path.join(publicDir, '404.html');

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    if (!path.extname(pathname)) filePath = path.join(publicDir, 'index.html');
  }
  sendFile(res, filePath);
});

const port = Number(process.env.PORT || 3000);
server.listen(port, () => {
  console.log(`ehemehe.lk local server running at http://localhost:${port}`);
  console.log(`Admin: http://localhost:${port}/admin`);
});
