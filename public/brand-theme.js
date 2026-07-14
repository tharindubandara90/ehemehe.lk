
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
      const text = (a.textContent || '').toLowerCase().replace(/\s+/g,'');
      const hasOldIcon = !!a.querySelector('.rounded-xl, .rounded-full');
      if ((text.includes('ehemehe') || text === 'e' || hasOldIcon) && !a.dataset.ehmLogoDone) {
        a.dataset.ehmLogoDone = '1';
        a.classList.add('ehm-logo-link','ehm-logo-replaced');
        a.innerHTML = '';
        a.appendChild(makeLogo('ehm-site-logo ehm-logo-keep'));
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
    document.querySelectorAll('a[href="/post"],a[href="/post/"]').forEach(a => a.setAttribute('href','/post-ad'));

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

  function tick() {
    ensureFavicon();
    replaceHeaderLogos();
    replaceInlineCyan();
    patchMarketplaceRoutes();
    markMobileOnlyLayout();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick);
  else tick();

  const observer = new MutationObserver(tick);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
