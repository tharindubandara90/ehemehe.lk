
(() => {
  const LOGO = '/assets/ehemehe_logo_header.png';
  const FAVICON = '/assets/ehemehe_favicon.png';
  const GREEN = '#3DC697';

  function ensureFavicon() {
    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = FAVICON;
  }

  function makeLogo(className='ehm-site-logo') {
    const img = document.createElement('img');
    img.src = LOGO;
    img.alt = 'EheMehe.lk';
    img.className = className;
    img.decoding = 'async';
    img.loading = 'eager';
    return img;
  }

  function replaceHeaderLogos() {
    const anchors = Array.from(document.querySelectorAll('a[href="/"], a[href="./"], a[href="index.html"]'));

    anchors.forEach(a => {
      if (a.classList.contains('ehm-logo-link') && a.closest('header') && a.parentElement) {
        a.parentElement.classList.add('ehm-mobile-header-row');
      }
    });
    anchors.forEach(a => {
      const text = (a.textContent || '').toLowerCase().replace(/\s+/g,'');
      const hasOldIcon = !!a.querySelector('.rounded-xl, .rounded-full');
      if ((text.includes('ehemehe') || text === 'e' || hasOldIcon) && !a.dataset.ehmLogoDone) {
        a.dataset.ehmLogoDone = '1';
        a.classList.add('ehm-logo-link','ehm-logo-replaced');
        a.innerHTML = '';
        a.appendChild(makeLogo('ehm-site-logo ehm-logo-keep'));

        const header = a.closest('header');
        if (header && a.parentElement) {
          a.parentElement.classList.add('ehm-mobile-header-row');
        }
      }
    });

    // Plain text admin/sidebar logo replacement
    Array.from(document.querySelectorAll('h1,h2,.brand,.logo,aside div,aside span')).forEach(el => {
      const text = (el.textContent || '').trim().toLowerCase();
      if (text === 'ehemehe.lk' && !el.dataset.ehmLogoDone && el.closest('aside, .sidebar, nav')) {
        el.dataset.ehmLogoDone = '1';
        el.innerHTML = '';
        el.appendChild(makeLogo('ehm-admin-logo'));
      }
    });
  }

  function replaceInlineCyan() {
    document.querySelectorAll('[style]').forEach(el => {
      let s = el.getAttribute('style') || '';
      if (s.includes('#06b6d4') || s.includes('#0891b2') || s.includes('#22d3ee')) {
        s = s.replaceAll('#06b6d4', GREEN).replaceAll('#0891b2', '#22A879').replaceAll('#22d3ee', '#7DE4BF');
        el.setAttribute('style', s);
      }
    });
  }


  function markMobileOnlyLayout() {
    const exact = (el, text) => (el.textContent || '').trim() === text;
    const marker = Array.from(document.querySelectorAll('span,div,p,h1,h2')).find(el =>
      exact(el, "Sri Lanka's #1 Modern Marketplace")
    );
    if (marker) {
      let node = marker;
      let hero = null;
      for (let i = 0; i < 9 && node; i++, node = node.parentElement) {
        const cls = String(node.className || '');
        if (/overflow-hidden/.test(cls) && /gradient|bg-primary|relative/.test(cls)) {
          hero = node;
        }
      }
      if (!hero) {
        node = marker;
        for (let i = 0; i < 7 && node; i++, node = node.parentElement) {
          if (node.tagName === 'SECTION') { hero = node; break; }
        }
      }
      if (!hero) {
        node = marker;
        for (let i = 0; i < 6 && node; i++, node = node.parentElement) hero = node;
      }
      if (hero) hero.classList.add('ehm-mobile-hide-hero');
    }

    // Remove any leaked favicon/SVG source text that an old cached HTML build may expose.
    Array.from(document.body.childNodes).forEach(n => {
      if (n.nodeType === Node.TEXT_NODE && /<rect|<text|<\/svg>|e\">/.test(n.textContent || '')) n.remove();
    });
  }


  function patchMarketplaceRoutes() {
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    // Keep the React five-step Post Ad flow as the single canonical implementation.
    // Older shells may still contain /post-ad links; normalize those links to /post
    // instead of sending current /post links to the legacy standalone form.
    document.querySelectorAll('a[href="/post-ad"],a[href="/post-ad/"]').forEach(a => a.setAttribute('href','/post'));

    document.querySelectorAll('a[href="/categories"],a[href="/categories/"]').forEach(a => {
      if (mobile) {
        a.style.display = 'none';
        a.setAttribute('aria-hidden','true');
      }
    });

    if (mobile) {
      const path = location.pathname.replace(/\/$/,'');
      if (path === '/categories') {
        location.replace('/');
        return;
      }
      Array.from(document.querySelectorAll('h1,h2,h3')).forEach(heading => {
        if ((heading.textContent || '').trim().toLowerCase() === 'browse categories') {
          const section = heading.closest('section') || heading.parentElement?.parentElement || heading.parentElement;
          if (section) section.style.display = 'none';
        }
      });
    }
  }


  function applyMobileResponsiveMode() {
    const ua = navigator.userAgent || '';
    const touch = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
    const mobileUA = /Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(ua);
    const physicalShortSide = Math.min(
      (window.screen && window.screen.width) || innerWidth,
      (window.screen && window.screen.height) || innerHeight
    );
    const isMobileDevice = mobileUA || (touch && physicalShortSide <= 1024);

    document.documentElement.classList.toggle('ehm-physical-mobile', !!isMobileDevice);
    document.body.classList.toggle('ehm-mobile-device', !!isMobileDevice);

    const path = location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
    document.body.classList.toggle('ehm-route-ad', /^\/ad\/[^/]+/.test(path));
    document.body.classList.toggle('ehm-route-post', path === '/post' || path === '/post-ad');
    document.body.classList.toggle('ehm-route-login', path === '/login');
    document.body.classList.toggle('ehm-route-signup', path === '/signup');
    document.body.classList.toggle('ehm-route-dashboard', path.startsWith('/dashboard'));
    document.body.classList.toggle(
      'ehm-route-listing',
      path === '/search' || path === '/categories' || path.startsWith('/category/')
    );
  }



  function enhanceDesktopHomeOlx() {
    const desktop = window.matchMedia && window.matchMedia('(min-width: 1024px)').matches;
    const path = location.pathname.replace(/\/index\.html$/i, '/').replace(/\/+$/, '') || '/';
    const active = desktop && path === '/';
    document.body.classList.toggle('ehm-desktop-olx-home', active);
    if (!active) return;

    // The old prepaint helper hid part of the hero form. The new desktop layout is stable without it.
    document.documentElement.classList.remove('ehm-desktop-home-prepaint');

    const byYw = (value) => document.querySelector(`[data-yw="${value}"]`);
    const headerActions = byYw('c3JjL2NvbXBvbmVudHMvSGVhZGVyLnRzeEAxMDQ6MTA');
    const postLabel = byYw('c3JjL2NvbXBvbmVudHMvSGVhZGVyLnRzeEAxMTA6MTQ');
    const postButton = postLabel?.closest('a');
    postButton?.classList.add('ehm-desktop-post-button');

    if (headerActions && !headerActions.querySelector('.ehm-desktop-favorites-link')) {
      const favorite = document.createElement('a');
      favorite.href = '/dashboard/favorites';
      favorite.className = 'ehm-desktop-favorites-link';
      favorite.textContent = 'Favorites';
      headerActions.insertBefore(favorite, postButton || headerActions.firstChild);
    }

    const loggedOutWrap = byYw('c3JjL2NvbXBvbmVudHMvSGVhZGVyLnRzeEAxMzk6MTQ');
    const loginLink = loggedOutWrap?.querySelector('a[href="/login"]');
    if (loginLink) {
      loginLink.textContent = 'Account';
      loginLink.classList.add('ehm-desktop-login-account');
    }

    const hero = byYw('c3JjL2NvbXBvbmVudHMvSGVyb1NlY3Rpb24udHN4QDE3OjQ');
    hero?.classList.add('ehm-olx-search-section');
    const heroForm = byYw('c3JjL2NvbXBvbmVudHMvSGVyb1NlY3Rpb24udHN4QDQ4OjEw');
    const searchBar = byYw('c3JjL2NvbXBvbmVudHMvSGVyb1NlY3Rpb24udHN4QDQ5OjEy');
    const queryField = byYw('c3JjL2NvbXBvbmVudHMvSGVyb1NlY3Rpb24udHN4QDUwOjE0');
    const locationField = byYw('c3JjL2NvbXBvbmVudHMvSGVyb1NlY3Rpb24udHN4QDYwOjE0');
    const searchButton = byYw('c3JjL2NvbXBvbmVudHMvSGVyb1NlY3Rpb24udHN4QDc1OjE0');
    heroForm?.classList.add('ehm-olx-search-form');
    searchBar?.classList.add('ehm-olx-search-bar');
    queryField?.classList.add('ehm-olx-query-field');
    locationField?.classList.add('ehm-olx-location-field');
    searchButton?.classList.add('ehm-olx-search-button');

    if (searchBar && locationField && !searchBar.querySelector('.ehm-olx-category-field')) {
      const categoryField = document.createElement('div');
      categoryField.className = 'ehm-olx-category-field';
      const categorySelect = document.createElement('select');
      categorySelect.setAttribute('aria-label', 'Category');
      categorySelect.innerHTML = '<option value="">All categories</option>';

      const categoryGrid = byYw('c3JjL2NvbXBvbmVudHMvQ2F0ZWdvcnlHcmlkLnRzeEAxMTo0');
      const categoryLinks = Array.from(categoryGrid?.querySelectorAll(':scope > a') || []);
      const fallback = [
        ['vehicles','Vehicles'], ['property','Property'], ['mobile-phones','Mobile Phones'],
        ['electronics','Electronics'], ['jobs','Jobs'], ['services','Services'],
        ['home-garden','Home & Garden'], ['fashion','Fashion']
      ];
      const options = categoryLinks.length ? categoryLinks.map((link) => {
        const href = link.getAttribute('href') || '';
        return [href.split('/').filter(Boolean).pop() || '', (link.textContent || '').trim()];
      }) : fallback;
      options.forEach(([value, label]) => {
        if (!value || !label) return;
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        categorySelect.appendChild(option);
      });
      categorySelect.value = heroForm?.dataset.ehmOlxCategory || '';
      categorySelect.addEventListener('change', () => {
        if (heroForm) heroForm.dataset.ehmOlxCategory = categorySelect.value;
      });
      categoryField.appendChild(categorySelect);
      searchBar.insertBefore(categoryField, locationField);
    }

    if (heroForm && !heroForm.dataset.ehmOlxSubmitBound) {
      heroForm.dataset.ehmOlxSubmitBound = '1';
      heroForm.addEventListener('submit', (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        const query = heroForm.querySelector('input[type="text"]')?.value?.trim() || '';
        const selects = heroForm.querySelectorAll('select');
        const category = heroForm.querySelector('.ehm-olx-category-field select')?.value || heroForm.dataset.ehmOlxCategory || '';
        const district = Array.from(selects).find((select) => !select.closest('.ehm-olx-category-field'))?.value || '';
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (category) params.set('category', category);
        if (district) params.set('district', district);
        location.assign(`/search${params.toString() ? `?${params}` : ''}`);
      }, true);
    }

    const categoriesSection = byYw('c3JjL3BhZ2VzL0hvbWVQYWdlLnRzeEAxOTo2');
    const categoriesHeading = byYw('c3JjL3BhZ2VzL0hvbWVQYWdlLnRzeEAyMToxMA');
    const categoryGrid = byYw('c3JjL2NvbXBvbmVudHMvQ2F0ZWdvcnlHcmlkLnRzeEAxMTo0');
    categoriesSection?.classList.add('ehm-olx-categories-section');
    categoriesHeading?.classList.add('ehm-olx-categories-heading');
    categoryGrid?.classList.add('ehm-olx-category-grid');

    byYw('c3JjL3BhZ2VzL0hvbWVQYWdlLnRzeEAzNTo2')?.classList.add('ehm-olx-featured-hidden');

    const latestSection = byYw('c3JjL3BhZ2VzL0hvbWVQYWdlLnRzeEA1OTo2');
    const latestHeadingRow = byYw('c3JjL3BhZ2VzL0hvbWVQYWdlLnRzeEA2MToxMA');
    const latestTitle = byYw('c3JjL3BhZ2VzL0hvbWVQYWdlLnRzeEA2MzoxNA');
    const latestGrid = byYw('c3JjL3BhZ2VzL0hvbWVQYWdlLnRzeEA3MDoxMA');
    latestSection?.classList.add('ehm-olx-latest-section');
    latestHeadingRow?.classList.add('ehm-olx-latest-heading');
    latestGrid?.classList.add('ehm-olx-latest-grid');
    if (latestTitle && latestTitle.textContent !== 'Fresh recommendations') {
      latestTitle.textContent = 'Fresh recommendations';
    }

    byYw('c3JjL3BhZ2VzL0hvbWVQYWdlLnRzeEA3OTo2')?.classList.add('ehm-olx-cta-hidden');
    byYw('c3JjL2NvbXBvbmVudHMvU3RhdHNTZWN0aW9uLnRzeEAxMzo0')?.classList.add('ehm-olx-stats-hidden');
  }

  function enhanceDesktopAccountButton() {
    if (!window.matchMedia || !window.matchMedia('(min-width: 768px)').matches) return;

    const accountWrap = document.querySelector('[data-yw="c3JjL2NvbXBvbmVudHMvSGVhZGVyLnRzeEAxMTQ6MTQ"]');
    const accountButton = document.querySelector('[data-yw="c3JjL2NvbXBvbmVudHMvSGVhZGVyLnRzeEAxMTU6MTY"]');
    const accountLabel = document.querySelector('[data-yw="c3JjL2NvbXBvbmVudHMvSGVhZGVyLnRzeEAxMjI6MTg"]');
    const postLabel = document.querySelector('[data-yw="c3JjL2NvbXBvbmVudHMvSGVhZGVyLnRzeEAxMTA6MTQ"]');
    const postButton = postLabel?.closest('a');

    if (!accountWrap || !accountButton || !accountLabel) return;

    accountWrap.classList.add('ehm-desktop-account-wrap');
    accountButton.classList.add('ehm-desktop-account-button');
    postButton?.classList.add('ehm-desktop-post-button');

    if (accountLabel.textContent !== 'Account') accountLabel.textContent = 'Account';
    accountLabel.classList.add('ehm-desktop-account-label');
  }


  function enhanceDashboardMobile() {
    const path = location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
    if (!path.startsWith('/dashboard')) return;

    document.body.classList.add('ehm-route-dashboard');

    const byYw = (value) => document.querySelector(`[data-yw="${value}"]`);
    const layout = byYw('c3JjL3BhZ2VzL0Rhc2hib2FyZFBhZ2UudHN4QDM4Ojg');
    const sidebar = byYw('c3JjL3BhZ2VzL0Rhc2hib2FyZFBhZ2UudHN4QDQwOjEw');
    const profileCard = byYw('c3JjL3BhZ2VzL0Rhc2hib2FyZFBhZ2UudHN4QDQxOjEy');
    const profileHead = byYw('c3JjL3BhZ2VzL0Rhc2hib2FyZFBhZ2UudHN4QDQzOjE0');
    const nav = byYw('c3JjL3BhZ2VzL0Rhc2hib2FyZFBhZ2UudHN4QDU0OjE0');
    const main = byYw('c3JjL3BhZ2VzL0Rhc2hib2FyZFBhZ2UudHN4QDgwOjEw');
    const stats = byYw('c3JjL3BhZ2VzL0Rhc2hib2FyZFBhZ2UudHN4QDg2OjE2');
    const quickCard = byYw('c3JjL3BhZ2VzL0Rhc2hib2FyZFBhZ2UudHN4QDEwMzoxNg');
    const quickActions = byYw('c3JjL3BhZ2VzL0Rhc2hib2FyZFBhZ2UudHN4QDEwNToxOA');

    layout?.classList.add('ehm-dash-layout');
    sidebar?.classList.add('ehm-dash-sidebar');
    profileCard?.classList.add('ehm-dash-profile-card');
    profileHead?.classList.add('ehm-dash-profile-head');
    nav?.classList.add('ehm-dash-nav');
    main?.classList.add('ehm-dash-main');
    stats?.classList.add('ehm-dash-stats');
    quickCard?.classList.add('ehm-dash-quick-card');
    quickActions?.classList.add('ehm-dash-quick-actions');

    if (nav) {
      const buttons = Array.from(nav.querySelectorAll('button'));
      buttons.slice(0, 5).forEach((button) => button.classList.add('ehm-dash-tab'));
      const signOut = buttons.find((button) => /sign out/i.test(button.textContent || ''));
      signOut?.classList.add('ehm-dash-signout');
      nav.querySelector('hr')?.classList.add('ehm-dash-divider');
    }

    stats?.querySelectorAll(':scope > div').forEach((card) => card.classList.add('ehm-dash-stat-card'));
  }

  function tick() {
    applyMobileResponsiveMode();
    enhanceDashboardMobile();
    enhanceDesktopHomeOlx();
    enhanceDesktopAccountButton();
    ensureFavicon();
    replaceHeaderLogos();
    replaceInlineCyan();
    patchMarketplaceRoutes();
    markMobileOnlyLayout();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick);
  else tick();

  let tickScheduled = false;
  function scheduleTick() {
    if (tickScheduled) return;
    tickScheduled = true;
    requestAnimationFrame(() => {
      tickScheduled = false;
      tick();
    });
  }

  const observer = new MutationObserver(scheduleTick);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('resize', scheduleTick, { passive: true });
  window.addEventListener('orientationchange', scheduleTick, { passive: true });
  window.addEventListener('popstate', scheduleTick);
})();
