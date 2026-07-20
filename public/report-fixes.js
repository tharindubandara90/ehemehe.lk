(() => {
  'use strict';

  const FAVORITES_KEY = 'ehemehe:favorites:v2';
  const PLACEHOLDER = '/assets/ad-placeholder.svg';
  const HOME_SNAPSHOT_KEY = 'ehemehe:desktopHomeLiveSnapshot:v1';
  const HOME_SNAPSHOT_TTL_MS = 6 * 60 * 60 * 1000;
  const AD_LIFETIME_MS = 25 * 24 * 60 * 60 * 1000;
  const DEMO_TITLES = new Set([
    '2020 Toyota Prius Hybrid - Low Mileage',
    'Modern 3-Bedroom House in Kandy',
    'iPhone 15 Pro Max 256GB - Space Black',
    'Samsung 65\" QLED 4K Smart TV',
    'Professional Guitar - Fender Stratocaster',
    'Honda CB150R - Excellent Condition',
    'MacBook Pro M3 14-inch 16GB/512GB',
    'Golden Retriever Puppies - 3 Months',
    'Modern Sofa Set - 7 Piece',
    'Software Engineer - Remote Position',
    'Land for Sale - 10 Perches in Kadawatha',
    'Professional Photography Services',
    'Nike Air Max 270 - White/Black',
    'Three Wheeler - Bajaj RE 205',
    'A-Level Physics Tuition - Online',
    'Industrial Sewing Machine - Juki',
    'Used Laptop - Core i5, 8GB RAM'
  ].map((title) => title.toLowerCase()));
  const DASHBOARD_TABS = Object.freeze({
    overview: 'Overview',
    ads: 'My Ads',
    favorites: 'Favorites',
    messages: 'Messages',
    settings: 'Settings'
  });
  const LABEL_TO_ROUTE = Object.freeze({
    overview: '/dashboard',
    'my ads': '/dashboard/ads',
    favorites: '/dashboard/favorites',
    'view favorites': '/dashboard/favorites',
    messages: '/dashboard/messages',
    settings: '/dashboard/settings',
    dashboard: '/dashboard'
  });

  let observer = null;
  let queued = false;
  let running = false;
  let dirty = false;
  let publicAdsPromise = null;
  let publicAdsCache = [];
  let dashboardSyncing = false;
  let dashboardRouteTimer = 0;

  const cleanPath = () => location.pathname
    .replace(/\/index\.html$/i, '/')
    .replace(/\/+$/, '') || '/';
  const isDashboard = () => cleanPath() === '/dashboard' || cleanPath().startsWith('/dashboard/');
  const text = (node) => String(node?.textContent || '').replace(/\s+/g, ' ').trim();
  const normalizedText = (node) => text(node).toLowerCase();
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[character]));

  function readFavoriteIds() {
    try {
      const value = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
      return new Set((Array.isArray(value) ? value : []).map(String));
    } catch (_) {
      return new Set();
    }
  }

  function saveFavoriteIds(ids) {
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...ids])); } catch (_) {}
    window.dispatchEvent(new CustomEvent('ehemehe:favorites-changed', { detail: { ids: [...ids] } }));
  }

  function normalizePhone(value) {
    let digits = String(value || '').replace(/\D/g, '');
    if (digits.startsWith('0094')) digits = digits.slice(2);
    if (digits.startsWith('0') && digits.length === 10) digits = `94${digits.slice(1)}`;
    if (digits.length === 9 && digits.startsWith('7')) digits = `94${digits}`;
    if (!/^947\d{8}$/.test(digits)) return String(value || '').trim();
    return `+94 ${digits.slice(2, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }

  async function getClient() {
    if (window.supabaseClient?.auth) return window.supabaseClient;
    if (typeof window.waitForSupabaseClient === 'function') return window.waitForSupabaseClient(7000);
    throw new Error('Account service is not ready.');
  }

  async function getSession() {
    const client = await getClient();
    return (await client.auth.getSession()).data?.session || null;
  }

  function footerHtml() {
    return `<footer class="ehm-unified-footer" data-ehm-footer-version="1">
      <div class="ehm-footer-inner">
        <div class="ehm-footer-brand">
          <a href="/"><img src="/assets/ehemehe_logo_header.png" alt="EheMehe.lk"></a>
          <p>Sri Lanka's modern classified marketplace for discovering, buying and selling goods and services.</p>
          <div class="ehm-footer-social" aria-label="Social media">
            <a href="https://www.facebook.com/ehemehe.lk" target="_blank" rel="noopener" aria-label="Facebook">f</a>
            <a href="https://www.instagram.com/ehemehe.lk" target="_blank" rel="noopener" aria-label="Instagram">◎</a>
            <a href="https://www.tiktok.com/@ehemehe.lk" target="_blank" rel="noopener" aria-label="TikTok">♪</a>
            <a href="https://www.youtube.com/@ehemehe.lk" target="_blank" rel="noopener" aria-label="YouTube">▶</a>
          </div>
        </div>
        <div class="ehm-footer-col"><h3>Quick Links</h3><a href="/">Home</a><a href="/categories">All Categories</a><a href="/post">Post an Ad</a><a href="/dashboard/favorites">Favorites</a></div>
        <div class="ehm-footer-col"><h3>Marketplace</h3><a href="/category/vehicles">Vehicles</a><a href="/category/property">Property</a><a href="/category/electronics">Electronics</a><a href="/category/services">Services</a></div>
        <div class="ehm-footer-col"><h3>Support</h3><a href="/help">Help Center</a><a href="/about">About Us</a><a href="/contact">Contact Us</a><a href="/terms">Terms & Conditions</a><a href="/privacy">Privacy Policy</a><a href="/safety">Safety Tips</a></div>
      </div>
      <div class="ehm-footer-bottom"><div><span>© 2026 ehemehe.lk. All rights reserved.</span><div class="ehm-footer-contact"><a href="mailto:ehemehe.lk@gmail.com">ehemehe.lk@gmail.com</a><a href="tel:+94766866867">+94 76 686 686 7</a><span>Kandy Road, Hasalaka</span></div></div></div>
    </footer>`;
  }

  function unifyFooter() {
    const footers = [...document.querySelectorAll('footer')];
    if (footers.length === 1 && footers[0].dataset.ehmFooterVersion === '1') return;
    const holder = document.createElement('div');
    holder.innerHTML = footerHtml();
    const replacement = holder.firstElementChild;
    if (footers[0]) footers[0].replaceWith(replacement);
    else document.body.appendChild(replacement);
    footers.slice(1).forEach((footer) => footer.remove());
  }

  function syncStoreFavorites() {
    const store = window.__EHM_STORE;
    if (!store?.getState || !store?.setState) return;
    const storedIds = [...readFavoriteIds()];
    const state = store.getState();

    if (!store.__ehmFavoritePersistence && typeof state.toggleFavorite === 'function') {
      store.__ehmFavoritePersistence = true;
      const originalToggle = state.toggleFavorite;
      store.setState({
        toggleFavorite: (id) => {
          originalToggle(id);
          queueMicrotask(() => {
            const latest = store.getState().favorites || [];
            saveFavoriteIds(new Set(latest.map(String)));
          });
        }
      });
    }

    const currentIds = (store.getState().favorites || []).map(String);
    const a = [...currentIds].sort().join('|');
    const b = [...storedIds].sort().join('|');
    if (a !== b) store.setState({ favorites: storedIds });
  }

  function normalizePublicAds(rows) {
    const map = new Map();
    (Array.isArray(rows) ? rows : []).forEach((raw) => {
      const id = String(raw?.id || raw?.ad_id || '');
      if (!id) return;
      const rawTitle = String(raw?.title || '').trim();
      if (DEMO_TITLES.has(rawTitle.toLowerCase())) return;
      const createdValue = raw?.created_at || raw?.createdAt || raw?.postedAt;
      const explicitExpiry = raw?.expires_at || raw?.expiresAt || raw?.custom_fields?.expires_at || raw?.customFields?.expires_at;
      const expiryMs = explicitExpiry ? new Date(explicitExpiry).getTime() : NaN;
      const createdMs = createdValue ? new Date(createdValue).getTime() : NaN;
      if ((Number.isFinite(expiryMs) && expiryMs <= Date.now()) ||
          (!Number.isFinite(expiryMs) && Number.isFinite(createdMs) && createdMs + AD_LIFETIME_MS <= Date.now())) return;
      let images = raw.images || [];
      if (typeof images === 'string') {
        try { images = JSON.parse(images); } catch (_) { images = []; }
      }
      if (!Array.isArray(images)) images = [];
      map.set(id, {
        ...raw,
        id,
        title: raw.title || 'Untitled Ad',
        price: raw.price,
        image: raw.image_url || raw.image || images[0] || PLACEHOLDER,
        location: raw.city || raw.location || raw.district || '',
        postedAt: raw.created_at || raw.postedAt || ''
      });
    });
    return [...map.values()];
  }

  function readCachedPublicAds() {
    try {
      const snapshot = JSON.parse(localStorage.getItem(HOME_SNAPSHOT_KEY) || 'null');
      const age = Date.now() - Number(snapshot?.savedAt || 0);
      if (!Array.isArray(snapshot?.ads) || !Number.isFinite(age) || age < 0 || age > HOME_SNAPSHOT_TTL_MS) return [];
      return normalizePublicAds(snapshot.ads);
    } catch (_) {
      return [];
    }
  }

  publicAdsCache = readCachedPublicAds();

  async function loadPublicAds(force = false) {
    if (!force && publicAdsPromise) return publicAdsPromise;
    publicAdsPromise = (async () => {
      const response = await fetch('/api/public-home?limit=250', {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin'
      });
      const payload = await response.json().catch(() => ({}));
      const rows = response.ok && Array.isArray(payload?.ads) ? payload.ads : [];
      const normalized = normalizePublicAds(rows);
      if (normalized.length || !publicAdsCache.length) publicAdsCache = normalized;
      return publicAdsCache;
    })().finally(() => {
      // Keep the resolved promise for this page lifetime so tab changes do not
      // trigger duplicate network requests. A forced refresh may replace it.
    });
    return publicAdsPromise;
  }

  function formatMoney(value) {
    const number = Number(String(value ?? '').replace(/[^\d.]/g, ''));
    return Number.isFinite(number) ? `LKR ${Math.round(number).toLocaleString('en-LK')}` : 'Price on request';
  }

  function favoriteRows(ids, ads = publicAdsCache) {
    return (Array.isArray(ads) ? ads : []).filter((ad) => ids.has(String(ad.id)));
  }

  function paintFavoritesPanel(panel, ids, ads, settled = false) {
    const rows = favoriteRows(ids, ads);
    const signature = `${settled ? 'settled' : 'cached'}|${[...ids].sort().join(',')}|${rows.map((row) => `${row.id}:${row.image}:${row.price}`).join('|')}`;
    if (panel.dataset.signature === signature) return;
    panel.dataset.signature = signature;

    if (rows.length) {
      panel.innerHTML = rows.map((ad) => `<article class="ehm-favorite-row">
        <a href="/ad/${encodeURIComponent(ad.id)}"><img src="${esc(ad.image)}" alt="${esc(ad.title)}" onerror="this.onerror=null;this.src='${PLACEHOLDER}'"></a>
        <div><a href="/ad/${encodeURIComponent(ad.id)}"><h3>${esc(ad.title)}</h3></a><strong>${esc(formatMoney(ad.price))}</strong><div>${esc(ad.location)}</div></div>
        <button type="button" class="ehm-remove-favorite" data-ehm-remove-favorite="${esc(ad.id)}">Remove from favourites</button>
      </article>`).join('');
      return;
    }

    if (ids.size && !settled) {
      panel.innerHTML = '<div class="ehm-dashboard-empty ehm-dashboard-loading"><strong>Loading favourites…</strong><span>Your saved ads are being prepared.</span></div>';
      return;
    }

    panel.innerHTML = '<div class="ehm-dashboard-empty"><strong>No favourites yet</strong><span>Saved ads will appear here.</span><a href="/">Browse Ads</a></div>';
  }

  async function renderFavorites() {
    if (cleanPath() !== '/dashboard/favorites') return false;
    const heading = [...document.querySelectorAll('h1,h2')].find((node) => /^favorites$/i.test(text(node)) && node.offsetParent !== null);
    if (!heading) return false;
    const section = heading.parentElement;
    if (!section) return false;

    [...section.children].forEach((child) => {
      if (child !== heading && !child.classList.contains('ehm-managed-favorites')) child.style.display = 'none';
    });

    let panel = section.querySelector('.ehm-managed-favorites');
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'ehm-managed-favorites';
      panel.setAttribute('aria-live', 'polite');
      section.appendChild(panel);
    }

    const ids = readFavoriteIds();
    paintFavoritesPanel(panel, ids, publicAdsCache, false);

    const ads = await loadPublicAds();
    if (cleanPath() !== '/dashboard/favorites' || !panel.isConnected) return true;
    paintFavoritesPanel(panel, ids, ads, true);
    return true;
  }

  function dashboardTab() {
    const path = cleanPath();
    if (path === '/dashboard') return 'overview';
    const tab = path.split('/')[2] || 'overview';
    return Object.prototype.hasOwnProperty.call(DASHBOARD_TABS, tab) ? tab : 'overview';
  }

  function routeForLabel(label) {
    return LABEL_TO_ROUTE[String(label || '').replace(/\s+/g, ' ').trim().toLowerCase()] || '';
  }

  function repairDashboardLinks() {
    document.querySelectorAll('a').forEach((anchor) => {
      const route = routeForLabel(text(anchor));
      if (!route) return;
      const currentHref = anchor.getAttribute('href') || '';
      if (currentHref === '/dashboard' || currentHref === '#' || currentHref === '') anchor.href = route;
    });
  }

  function dashboardNav() {
    if (!isDashboard() || dashboardSyncing) return;
    const activeTab = dashboardTab();
    const buttons = [...document.querySelectorAll('nav button, aside button, [role="navigation"] button')]
      .filter((button) => Object.values(DASHBOARD_TABS).includes(text(button)));

    buttons.forEach((button) => {
      const entry = Object.entries(DASHBOARD_TABS).find(([, label]) => label === text(button));
      const key = entry?.[0];
      button.classList.toggle('ehm-active-dashboard-link', key === activeTab);
      if (key) button.dataset.ehmDashboardTarget = key;
    });

    const wanted = buttons.find((button) => text(button) === DASHBOARD_TABS[activeTab]);
    const visibleMainHeading = [...document.querySelectorAll('main h1, main h2')]
      .find((heading) => heading.offsetParent !== null && Object.values(DASHBOARD_TABS).includes(text(heading)));
    if (wanted && text(visibleMainHeading) !== DASHBOARD_TABS[activeTab]) {
      dashboardSyncing = true;
      wanted.click();
      requestAnimationFrame(() => { dashboardSyncing = false; });
    }
  }

  function scheduleDashboardRouteSync() {
    window.clearTimeout(dashboardRouteTimer);
    const delays = [0, 16, 60, 140, 300, 600];
    const runAt = (index) => {
      if (index >= delays.length || !isDashboard()) return;
      dashboardRouteTimer = window.setTimeout(async () => {
        dashboardNav();
        if (cleanPath() === '/dashboard/favorites') await renderFavorites();
        if (index + 1 < delays.length) runAt(index + 1);
      }, delays[index]);
    };
    runAt(0);
  }

  function inputFor(container, possibleLabels) {
    const labels = (Array.isArray(possibleLabels) ? possibleLabels : [possibleLabels]).map((label) => label.toLowerCase());
    const label = [...container.querySelectorAll('label')].find((node) => labels.some((wanted) => normalizedText(node).replace(/\s*\*$/, '') === wanted));
    if (!label) return null;
    if (label.htmlFor) {
      const associated = document.getElementById(label.htmlFor);
      if (associated) return associated;
    }
    return label.parentElement?.querySelector('input,textarea,select') || null;
  }

  function updateStoreUser(user) {
    const store = window.__EHM_STORE;
    if (!store?.getState) return;
    const current = store.getState().currentUser || {};
    store.getState().login?.({ ...current, ...user });
  }

  function profileSettings() {
    if (cleanPath() !== '/dashboard/settings') return;
    const heading = [...document.querySelectorAll('h1,h2')].find((node) => /profile settings/i.test(text(node)));
    const card = heading?.parentElement?.querySelector('.bg-white') || heading?.nextElementSibling;
    if (!heading || !card) return;

    const name = inputFor(card, ['full name', 'name']);
    const email = inputFor(card, ['email', 'email address']);
    const phone = inputFor(card, ['phone', 'phone number', 'mobile number']);
    const save = [...card.querySelectorAll('button')].find((button) => /save changes/i.test(text(button)));

    if (phone && phone.dataset.ehmPhoneFormat !== '1') {
      phone.dataset.ehmPhoneFormat = '1';
      phone.type = 'tel';
      phone.inputMode = 'tel';
      phone.placeholder = '+94 7X XXX XXXX';
      phone.value = normalizePhone(phone.value);
      phone.addEventListener('blur', () => { phone.value = normalizePhone(phone.value); });
    }

    let status = card.querySelector('.ehm-settings-status');
    if (!status) {
      status = document.createElement('div');
      status.className = 'ehm-settings-status';
      status.setAttribute('aria-live', 'polite');
      save?.insertAdjacentElement('afterend', status);
    }

    if (save && save.dataset.ehmProfileSave !== '1') {
      save.dataset.ehmProfileSave = '1';
      save.type = 'button';
      save.addEventListener('click', async (event) => {
        event.preventDefault();
        save.disabled = true;
        status.className = 'ehm-settings-status';
        status.textContent = 'Saving changes...';
        try {
          const authSession = await getSession();
          if (!authSession?.access_token) throw new Error('Log in again to save changes.');
          const response = await fetch('/api/update-profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authSession.access_token}` },
            body: JSON.stringify({ name: name?.value, email: email?.value, phone: phone?.value })
          });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok || payload.ok === false) throw new Error(payload.message || 'Could not save changes.');
          if (phone) phone.value = normalizePhone(payload.user?.phone || phone.value);
          updateStoreUser(payload.user || {});
          try { await window.supabaseClient?.auth?.refreshSession?.(); } catch (_) {}
          status.className = 'ehm-settings-status success';
          status.textContent = 'Changes saved successfully.';
          window.dispatchEvent(new Event('ehemehe:auth-changed'));
        } catch (error) {
          status.className = 'ehm-settings-status error';
          status.textContent = error.message || 'Could not save changes.';
        } finally {
          save.disabled = false;
        }
      });
    }


  }

  function hideMobileHeaderFavorites() {
    if (!window.matchMedia?.('(max-width: 767px)').matches) return;
    const candidates = Array.from(document.querySelectorAll('a[href*="/dashboard/favorites"], button'));
    candidates.forEach((node) => {
      const label = text(node).toLowerCase();
      if (label !== 'favorites' && label !== 'favourites') return;
      if (node.closest('.ehm-mobile-bottom-nav, footer, [data-ehm-favorites-view]')) return;
      const header = node.closest('header');
      const nearTop = (() => {
        try { return node.getBoundingClientRect().top < 190; } catch (_) { return false; }
      })();
      if (header || nearTop) node.classList.add('ehm-mobile-header-favorites-hidden');
    });
  }

  function mobileNav() {
    const nav = [...document.querySelectorAll('nav')].find((node) => /Home/.test(text(node)) && /Post Ad/.test(text(node)) && getComputedStyle(node).position === 'fixed');
    if (!nav) return;
    nav.classList.add('ehm-mobile-bottom-nav');
    const links = [...nav.querySelectorAll('a')];
    let favoriteLink = links.find((anchor) => /favorites/i.test(text(anchor)));
    if (!favoriteLink) {
      const categoriesLink = links.find((anchor) => /categories/i.test(text(anchor)));
      if (categoriesLink) {
        categoriesLink.href = '/dashboard/favorites';
        categoriesLink.classList.add('ehm-mobile-favorites-link');
        const label = categoriesLink.querySelector('span');
        if (label) label.textContent = 'Favorites';
        const svg = categoriesLink.querySelector('svg');
        if (svg) svg.outerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.5 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
        favoriteLink = categoriesLink;
      }
    }

    const path = cleanPath();
    links.forEach((anchor) => {
      const href = (anchor.getAttribute('href') || '').replace(/\/+$/, '') || '/';
      const active = href === '/' ? path === '/' : (href === '/dashboard' ? path === '/dashboard' : path.startsWith(href));
      anchor.dataset.ehmActive = active ? 'true' : 'false';
      anchor.setAttribute('aria-current', active ? 'page' : 'false');
    });
  }

  function allCategoriesBack() {
    if (!cleanPath().startsWith('/category/')) return;
    const heading = [...document.querySelectorAll('h1')].find((node) => node.offsetParent !== null);
    if (!heading || document.querySelector('.ehm-all-categories-back')) return;
    const link = document.createElement('a');
    link.href = '/categories';
    link.className = 'ehm-all-categories-back';
    link.textContent = 'All Categories';
    heading.parentElement?.insertBefore(link, heading.nextSibling);
  }

  function imageFallbacks() {
    document.querySelectorAll('img').forEach((image) => {
      if (image.dataset.ehmFallback === '1') return;
      image.dataset.ehmFallback = '1';
      if (!image.getAttribute('src')) image.src = PLACEHOLDER;
      image.addEventListener('error', () => {
        if (!image.src.endsWith('/assets/ad-placeholder.svg')) {
          image.classList.add('ehm-img-placeholder');
          image.src = PLACEHOLDER;
        }
      });
    });
  }

  function routeClasses() {
    const path = cleanPath();
    const legal = ['/terms', '/privacy', '/safety', '/contact'].includes(path);
    document.body.classList.toggle('ehm-route-help', path === '/help');
    document.body.classList.toggle('ehm-legal-route', legal);
    document.body.classList.toggle('ehm-dashboard-ads-route', path === '/dashboard/ads');
    document.body.classList.toggle('ehm-dashboard-favorites-route', path === '/dashboard/favorites');
  }

  async function run() {
    if (running) { dirty = true; return; }
    running = true;
    queued = false;
    try {
      routeClasses();
      unifyFooter();
      syncStoreFavorites();
      repairDashboardLinks();
      dashboardNav();
      profileSettings();
      hideMobileHeaderFavorites();
      mobileNav();
      allCategoriesBack();
      imageFallbacks();
      await renderFavorites();
    } finally {
      running = false;
      if (dirty) {
        dirty = false;
        queue();
      }
    }
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => run().catch((error) => console.error('EheMehe report fixes failed:', error)));
  }

  document.addEventListener('click', (event) => {
    const mobileFavoriteLink = event.target.closest?.('.ehm-mobile-favorites-link, .ehm-mobile-bottom-nav a[href="/dashboard/favorites"]');
    if (mobileFavoriteLink) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      if (cleanPath() === '/dashboard/favorites') {
        queue();
      } else {
        window.location.assign('/dashboard/favorites');
      }
      return;
    }

    const remove = event.target.closest?.('[data-ehm-remove-favorite]');
    if (remove) {
      event.preventDefault();
      const ids = readFavoriteIds();
      ids.delete(String(remove.dataset.ehmRemoveFavorite));
      saveFavoriteIds(ids);
      window.__EHM_STORE?.setState?.({ favorites: [...ids] });
      const panel = document.querySelector('.ehm-managed-favorites');
      if (panel) panel.dataset.signature = '';
      queue();
      return;
    }

    const dashboardTarget = event.target.closest?.('[data-ehm-dashboard-target]');
    if (dashboardTarget && isDashboard()) {
      const key = dashboardTarget.dataset.ehmDashboardTarget || 'overview';
      const route = key === 'overview' ? '/dashboard' : `/dashboard/${key}`;
      if (cleanPath() !== route) history.replaceState({}, '', route);
      queue();
      scheduleDashboardRouteSync();
      return;
    }

    const button = event.target.closest?.('button');
    const route = routeForLabel(text(button));
    if (button && route && !button.dataset.ehmDashboardTarget) {
      event.preventDefault();
      if (isDashboard()) {
        history.replaceState({}, '', route);
        queue();
        scheduleDashboardRouteSync();
      } else {
        location.assign(route);
      }
    }
  }, true);

  ['popstate', 'ehemehe:routechange', 'ehemehe:auth-changed', 'ehemehe:favorites-changed']
    .forEach((eventName) => window.addEventListener(eventName, () => {
      queue();
      scheduleDashboardRouteSync();
    }));

  function init() {
    observer = new MutationObserver(queue);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    if (isDashboard()) loadPublicAds().catch(() => {});
    queue();
    scheduleDashboardRouteSync();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
