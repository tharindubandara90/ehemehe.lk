(function () {
  'use strict';

  const AUTH_STORAGE_KEYS = ['ehemehe-auth', 'sb-ieymsjeywkapqeniirlm-auth-token'];

  function cleanPath(pathname) {
    return String(pathname || '').replace(/\/index\.html$/i, '/').replace(/\/+$/, '') || '/';
  }

  function isPostPath(pathname) {
    const path = cleanPath(pathname);
    return path === '/post' || path === '/post-ad';
  }

  function safeUrl(value) {
    try { return new URL(value, location.href); }
    catch (_) { return null; }
  }

  function findSession(value, depth) {
    if (!value || depth > 4) return null;
    if (typeof value === 'string') {
      try { return findSession(JSON.parse(value), depth + 1); }
      catch (_) { return null; }
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findSession(item, depth + 1);
        if (found) return found;
      }
      return null;
    }
    if (typeof value !== 'object') return null;

    if (value.access_token || value.refresh_token || value.user) return value;
    for (const key of ['currentSession', 'session', 'data', 'value']) {
      const found = findSession(value[key], depth + 1);
      if (found) return found;
    }
    return null;
  }

  function storedSession() {
    try {
      for (const key of AUTH_STORAGE_KEYS) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const session = findSession(raw, 0);
        if (session && (session.refresh_token || session.access_token || session.user?.id)) return session;
      }
    } catch (_) {}
    return null;
  }

  function isLikelySignedIn() {
    return !!storedSession();
  }

  function returnTarget(url) {
    const path = cleanPath(url.pathname) === '/post-ad' ? '/post' : cleanPath(url.pathname);
    return `${path}${url.search || ''}${url.hash || ''}`;
  }

  function authUrl(url) {
    return `/signup?returnTo=${encodeURIComponent(returnTarget(url))}`;
  }

  function redirectToAuth(url) {
    if (window.__ehmPostAuthRedirecting) return;
    window.__ehmPostAuthRedirecting = true;
    window.__EHM_BLOCK_APP_BOOT = true;
    document.documentElement.classList.add('ehm-post-auth-redirect');
    location.replace(authUrl(url));
  }

  function guardUrl(value) {
    const url = safeUrl(value);
    if (!url || url.origin !== location.origin || !isPostPath(url.pathname)) return false;
    if (isLikelySignedIn()) return false;
    redirectToAuth(url);
    return true;
  }

  document.addEventListener('click', function (event) {
    const link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!link || !guardUrl(link.href)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }, true);

  const pushState = history.pushState.bind(history);
  const replaceState = history.replaceState.bind(history);

  history.pushState = function (state, title, url) {
    if (url != null && guardUrl(url)) return;
    return pushState(state, title, url);
  };

  history.replaceState = function (state, title, url) {
    if (url != null && guardUrl(url)) return;
    return replaceState(state, title, url);
  };

  window.EHM_POST_AUTH_GATE = Object.freeze({
    isLikelySignedIn,
    guardUrl
  });

  const current = safeUrl(location.href);
  if (current && isPostPath(current.pathname) && !isLikelySignedIn()) {
    redirectToAuth(current);
  }
})();
