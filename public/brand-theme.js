
(() => {
  const LOGO = '/assets/ehemehe_logo.png';
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

  function tick() {
    ensureFavicon();
    replaceHeaderLogos();
    replaceInlineCyan();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick);
  else tick();

  const observer = new MutationObserver(tick);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
