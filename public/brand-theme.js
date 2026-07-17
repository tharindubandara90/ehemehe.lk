
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
