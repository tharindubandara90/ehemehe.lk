'use strict';

// All public API URLs are dispatched through one Vercel Function so the
// project stays within the Hobby plan's per-deployment function limit.
const apiRouteLoaders = Object.freeze({
  '/api/ad-image': () => require('../api-handlers/ad-image'),
  '/api/auth-settings': () => require('../api-handlers/auth-settings'),
  '/api/login-user': () => require('../api-handlers/login-user'),
  '/api/my-ads': () => require('../api-handlers/my-ads'),
  '/api/public-ad': () => require('../api-handlers/public-ad'),
  '/api/public-home': () => require('../api-handlers/public-home'),
  '/api/public-ads': () => require('../api-handlers/public-ads'),
  '/api/public-promotions': () => require('../api-handlers/public-promotions'),
  '/api/publish-ad': () => require('../api-handlers/publish-ad'),
  '/api/register-phone-user': () => require('../api-handlers/register-phone-user'),
  '/api/register-verified-user': () => require('../api-handlers/register-verified-user'),
  '/api/report-ad': () => require('../api-handlers/report-ad'),
  '/api/request-otp': () => require('../api-handlers/request-otp'),
  '/api/request-registration-otp': () => require('../api-handlers/request-registration-otp'),
  '/api/reset-phone-password': () => require('../api-handlers/reset-phone-password'),
  '/api/update-my-ad': () => require('../api-handlers/update-my-ad'),
  '/api/delete-my-ad': () => require('../api-handlers/delete-my-ad'),
  '/api/update-profile': () => require('../api-handlers/update-profile'),
  '/api/delete-account': () => require('../api-handlers/delete-account'),
  '/api/upload-profile-photo': () => require('../api-handlers/upload-profile-photo'),
  '/api/validate-ad-phones': () => require('../api-handlers/validate-ad-phones'),
  '/api/verify-otp': () => require('../api-handlers/verify-otp'),
  '/api/verify-registration-otp': () => require('../api-handlers/verify-registration-otp')
});

const apiHandlerCache = new Map();

function sendJson(res, status, body) {
  if (res.writableEnded) return;
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function cleanRouteName(value) {
  let route = Array.isArray(value) ? value[0] : value;
  route = String(route || '').trim();
  try { route = decodeURIComponent(route); } catch (_) { return ''; }
  route = route.replace(/^\/+|\/+$/g, '').replace(/\.js$/i, '');
  if (!route || !/^[a-z0-9-]+$/i.test(route)) return '';
  return `/api/${route}`;
}

function apiPathForRequest(req) {
  let url;
  try {
    url = new URL(req.url || '/', 'http://localhost');
  } catch (_) {
    return '';
  }

  // Vercel's rewrite adds __api_route. req.query is available in the Node
  // runtime, while URLSearchParams keeps this working in local/test runtimes.
  const rewrittenRoute = req.query?.__api_route ?? url.searchParams.get('__api_route');
  const rewrittenPath = cleanRouteName(rewrittenRoute);
  if (rewrittenPath) return rewrittenPath;

  let pathname = url.pathname.replace(/\/+$/g, '') || '/';
  pathname = pathname.replace(/\.js$/i, '');
  return pathname;
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

async function dispatchApi(req, res) {
  const pathname = apiPathForRequest(req);
  let handler;
  try {
    handler = apiHandlerFor(pathname);
  } catch (error) {
    console.error(`API startup failed for ${pathname || 'unknown route'}:`, error);
    sendJson(res, 500, { ok: false, message: 'This service is temporarily unavailable. Please try again.' });
    return true;
  }

  if (!handler) {
    sendJson(res, 404, { ok: false, message: `API route not found: ${pathname || 'unknown'}` });
    return true;
  }

  try {
    await handler(req, res);
  } catch (error) {
    console.error(`API request failed for ${pathname}:`, error);
    sendJson(res, 500, { ok: false, message: error?.message || 'Internal API error' });
  }
  return true;
}

module.exports = {
  apiRouteLoaders,
  apiPathForRequest,
  apiHandlerFor,
  dispatchApi
};
