(() => {
  'use strict';
  const path = location.pathname.replace(/\/+$/, '') || '/';
  const version = '20260715-final-performance-fix';
  const loaded = new Map();

  function script(src) {
    if (loaded.has(src)) return loaded.get(src);
    const promise = new Promise((resolve, reject) => {
      const element = document.createElement('script');
      element.src = `${src}${src.includes('?') ? '&' : '?'}v=${version}`;
      element.defer = true;
      element.onload = resolve;
      element.onerror = () => reject(new Error(`Could not load ${src}`));
      document.head.appendChild(element);
    });
    loaded.set(src, promise);
    return promise;
  }

  async function boot() {
    const authRoute = path === '/login' || path === '/signup';
    const postRoute = path === '/post' || path === '/post-ad';
    const dashboardRoute = path === '/dashboard' || path.startsWith('/dashboard/');
    const listingRoute = path === '/' || path === '/search' || path === '/categories' || path.startsWith('/category/');

    try {
      if (authRoute) {
        await script('/otp-client.js');
        await script('/auth-unified.js');
        return;
      }

      await script('/brand-theme.js');

      if (postRoute) {
        await script('/otp-client.js');
        await script('/post-ad-category-fields.js');
        await script('/post-ad-runtime.js');
        return;
      }

      if (dashboardRoute) {
        await script('/post-ad-runtime.js');
        return;
      }

      if (listingRoute) {
        await script('/index-filters.js');
      }
    } catch (error) {
      console.error('Route enhancement failed:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
