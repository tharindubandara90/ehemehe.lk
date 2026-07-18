(function desktopHomeExactBootstrap() {
  'use strict';

  const HOME_PATH = (location.pathname.replace(/\/index\.html$/i, '/').replace(/\/+$/, '') || '/');
  if (HOME_PATH !== '/' || window.__EHM_DESKTOP_HOME_EXACT !== true) return;

  const FAVORITES_KEY = 'ehemehe:favorites:v2';
  // Public Supabase credentials are intentionally browser-safe (anon role).
  // They provide a resilient read-only fallback when a deployment's /api
  // routing is temporarily unavailable; RLS remains the source of access control.
  const PUBLIC_SUPABASE_URL = 'https://ieymsjeywkapqeniirlm.supabase.co';
  const PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlleW1zamV5d2thcHFlbmlpcmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MjkxOTQsImV4cCI6MjA5OTUwNTE5NH0.L2T1cEjznaeJHa4DVC9F8dA5c-e3P0OQ9U4vetJIeMM';
  const PUBLIC_AD_STATUSES = new Set(['approved', 'active', 'published']);
  const FALLBACK_CATEGORIES = [
    { key: 'vehicles', label: 'Vehicles', aliases: ['vehicle','vehicles','cars','car','motorbike','motorbikes'], icon: 'car' },
    { key: 'property', label: 'Property', aliases: ['property','properties','house','land','apartment'], icon: 'building' },
    { key: 'electronics', label: 'Electronics', aliases: ['electronics','electronic'], icon: 'monitor' },
    { key: 'mobile-phones-tablets', label: 'Mobile Phones & Tablets', aliases: ['mobile','phone','phones','tablet','mobile-phones-tablets'], icon: 'phone' },
    { key: 'home-garden', label: 'Home & Garden', aliases: ['home-garden','home','garden','furniture'], icon: 'home' },
    { key: 'health-beauty', label: 'Health & Beauty', aliases: ['health-beauty','health','beauty'], icon: 'heart' },
    { key: 'sports-hobbies-kids', label: 'Sports, Hobbies & Kids', aliases: ['sports-hobbies-kids','sports','hobbies','kids'], icon: 'trophy' },
    { key: 'education', label: 'Education', aliases: ['education','classes','tuition'], icon: 'education' }
  ];

  const FALLBACK_DISTRICTS = ['Ampara','Anuradhapura','Badulla','Batticaloa','Colombo','Galle','Gampaha','Hambantota','Jaffna','Kalutara','Kandy','Kegalle','Kilinochchi','Kurunegala','Mannar','Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya','Polonnaruwa','Puttalam','Ratnapura','Trincomalee','Vavuniya'];

  const appState = {
    ads: [],
    categories: FALLBACK_CATEGORIES.slice(),
    districts: FALLBACK_DISTRICTS.map((name) => ({ id: slug(name), name, slug: slug(name) })),
    cities: [],
    query: '',
    category: '',
    location: '',
    loaded: false,
    failed: false
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function slug(value) {
    return String(value || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[character]));
  }

  function parseObject(value) {
    if (!value) return {};
    if (typeof value === 'object') return value;
    try { return JSON.parse(value); } catch (_) { return {}; }
  }

  function formatPrice(value, currency) {
    if (value === '' || value === null || value === undefined) return 'Price on request';
    const number = Number(String(value).replace(/[^0-9.-]/g, ''));
    if (!Number.isFinite(number)) return `${currency || 'LKR'} ${String(value)}`;
    return `${currency || 'LKR'} ${number.toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;
  }

  function relativeDate(value) {
    const date = new Date(value || '');
    if (!Number.isFinite(date.getTime())) return 'Today';
    const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-LK', { day: 'numeric', month: 'short' });
  }

  function normalizeAd(row) {
    const fields = parseObject(row.custom_fields || row.customFields);
    const image = String(row.image_url || row.image || (Array.isArray(row.images) ? row.images[0] : '') || '');
    const categoryName = String(row.category_name || row.categoryName || row.categories?.name || fields.subcategory_name || fields.category_name || row.category || '');
    const district = String(row.district_name || row.district || fields.district || fields.district_name || '');
    const city = String(row.city_name || row.cityName || row.cities?.name || fields.city || fields.city_name || '');
    const location = city || district || 'Sri Lanka';
    const categoryTokens = [row.category_id,row.categoryId,row.subcategory_id,row.subcategoryId,categoryName,fields.category_slug,fields.subcategory_slug]
      .map(slug).filter(Boolean);
    return {
      id: String(row.id || row.ad_id || row.uuid || ''),
      title: String(row.title || 'Untitled Ad'),
      description: String(row.description || ''),
      price: row.price,
      currency: String(row.currency || 'LKR'),
      image,
      categoryName,
      categoryTokens,
      district,
      city,
      location,
      condition: String(row.condition || ''),
      createdAt: row.created_at || row.updated_at || '',
      featured: Boolean(row.is_featured || row.isFeatured || row.featured),
      promoted: Boolean(row.is_promoted || row.isPromoted || row.promoted || row.promotion_type),
      customFields: fields
    };
  }

  function iconSvg(name) {
    const common = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
    const paths = {
      search: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.8-3.8"></path>',
      pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"></path><circle cx="12" cy="10" r="2.5"></circle>',
      arrow: '<path d="M5 12h14"></path><path d="m14 7 5 5-5 5"></path>',
      plus: '<circle cx="12" cy="12" r="9"></circle><path d="M12 8v8M8 12h8"></path>',
      car: '<path d="M5 17h14l-1-6-2-3H8l-2 3-1 6Z"></path><path d="M7 17v2M17 17v2M6 13h12"></path><circle cx="8" cy="15" r="1"></circle><circle cx="16" cy="15" r="1"></circle>',
      building: '<path d="M4 21h16M6 21V5l6-2 6 2v16M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1"></path>',
      monitor: '<rect x="3" y="4" width="18" height="13" rx="2"></rect><path d="M8 21h8M12 17v4"></path>',
      phone: '<rect x="7" y="2" width="10" height="20" rx="2"></rect><path d="M11 18h2"></path>',
      home: '<path d="m3 11 9-8 9 8"></path><path d="M5 10v11h14V10M9 21v-7h6v7"></path>',
      heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"></path>',
      trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"></path><path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 13v5M8 21h8M9 18h6"></path>',
      education: '<path d="m2 10 10-5 10 5-10 5L2 10Z"></path><path d="M6 12.5V17c3 2 9 2 12 0v-4.5M22 10v6"></path>',
      image: '<rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="8.5" cy="9" r="1.5"></circle><path d="m21 15-5-5L5 20"></path>',
      clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>'
    };
    return `<svg ${common} aria-hidden="true">${paths[name] || paths.image}</svg>`;
  }

  function fallbackCategoryMarkup() {
    return FALLBACK_CATEGORIES.map((category) => `
      <button class="ehdx-category" type="button" data-ehdx-category="${escapeHtml(category.key)}" aria-pressed="false">
        <span class="ehdx-category-icon">${iconSvg(category.icon)}</span>
        <span class="ehdx-category-label">${escapeHtml(category.label)}</span>
      </button>`).join('');
  }

  function baseMarkup() {
    return `
      <header class="ehdx-header">
        <div class="ehdx-wrap ehdx-header-inner">
          <a class="ehdx-logo" href="/" aria-label="EheMehe home"><img src="/assets/ehemehe_logo_header.webp?v=eeb21c8b6d956e1a" alt="EheMehe"></a>
          <nav class="ehdx-header-nav" aria-label="Account navigation">
            <a href="/dashboard/favorites">Favorites</a>
            <a class="ehdx-post-btn" href="/post">${iconSvg('plus')}<span>Post an Ad</span></a>
            <a href="/dashboard">Account</a>
          </nav>
        </div>
      </header>
      <main>
        <section class="ehdx-discovery" aria-label="Search marketplace">
          <div class="ehdx-wrap">
            <form class="ehdx-searchbar" id="ehdxSearchForm">
              <label class="ehdx-search-cell">
                ${iconSvg('search')}
                <input id="ehdxQuery" type="search" placeholder="Search for anything..." autocomplete="off" aria-label="Search ads">
              </label>
              <label class="ehdx-search-cell">
                <select id="ehdxCategory" aria-label="All categories"><option value="">All categories</option></select>
              </label>
              <label class="ehdx-search-cell ehdx-search-location">
                ${iconSvg('pin')}
                <select id="ehdxLocation" aria-label="Location"><option value="">Location</option></select>
              </label>
              <button class="ehdx-search-submit" type="submit"><span>Search</span>${iconSvg('arrow')}</button>
            </form>
            <div class="ehdx-categories" id="ehdxCategories">${fallbackCategoryMarkup()}</div>
          </div>
        </section>
        <section class="ehdx-results-section" aria-labelledby="ehdxResultsTitle">
          <div class="ehdx-results-wrap">
            <div class="ehdx-results-head">
              <div><h1 class="ehdx-results-title" id="ehdxResultsTitle">Latest Ads</h1><p class="ehdx-results-count" id="ehdxCount">Loading listings...</p></div>
              <button type="button" class="ehdx-clear" id="ehdxClear">Clear filters</button>
            </div>
            <div class="ehdx-grid" id="ehdxGrid" aria-live="polite">${Array.from({length:8},()=>'<div class="ehdx-skeleton" aria-hidden="true"></div>').join('')}</div>
          </div>
        </section>
      </main>
      <footer class="ehdx-footer">
        <div class="ehdx-wrap ehdx-footer-grid">
          <div class="ehdx-footer-brand"><img src="/assets/ehemehe_logo_header.webp?v=eeb21c8b6d956e1a" alt="EheMehe"><p>Sri Lanka's modern marketplace to buy, sell and discover anything.</p></div>
          <div><h3>Quick Links</h3><ul><li><a href="/">Home</a></li><li><a href="/browse">Browse Ads</a></li><li><a href="/post">Post an Ad</a></li></ul></div>
          <div><h3>Marketplace</h3><ul><li><a href="/browse">Categories</a></li><li><a href="/dashboard/favorites">Favorites</a></li><li><a href="/dashboard">My Account</a></li></ul></div>
          <div><h3>Support</h3><ul><li><a href="/help">Help Center</a></li><li><a href="/contact">Contact Us</a></li><li><a href="/privacy">Privacy Policy</a></li></ul></div>
        </div>
      </footer>
      <div class="ehdx-toast" id="ehdxToast" role="status"></div>`;
  }

  function mount() {
    const host = document.getElementById('ehmDesktopHomeExact');
    if (!host) return false;
    if (!host.dataset.mounted) {
      host.innerHTML = baseMarkup();
      host.dataset.mounted = '1';
      bindEvents();
      populateSelects();
    }
    return true;
  }

  function readFavorites() {
    try {
      const value = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
      return new Set(Array.isArray(value) ? value.map(String) : []);
    } catch (_) { return new Set(); }
  }

  function writeFavorites(set) {
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(set))); } catch (_) {}
  }

  function showToast(message) {
    const toast = $('#ehdxToast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 1700);
  }

  function matchesCategory(ad) {
    if (!appState.category) return true;
    const selected = FALLBACK_CATEGORIES.find((category) => category.key === appState.category);
    if (!selected) return true;
    const haystack = [ad.categoryName,...ad.categoryTokens].map(slug).filter(Boolean);
    return selected.aliases.some((alias) => haystack.some((token) => token === slug(alias) || token.startsWith(`${slug(alias)}-`) || token.includes(slug(alias))));
  }

  function matchesLocation(ad) {
    if (!appState.location) return true;
    const value = slug(appState.location);
    return [ad.city,ad.district,ad.location].some((field) => slug(field) === value || slug(field).includes(value));
  }

  function matchesQuery(ad) {
    const query = slug(appState.query).replace(/-/g, ' ').trim();
    if (!query) return true;
    const tokens = query.split(/\s+/).filter(Boolean);
    const haystack = slug([ad.title,ad.description,ad.categoryName,ad.location,Object.values(ad.customFields || {}).join(' ')].join(' ')).replace(/-/g, ' ');
    return tokens.every((token) => haystack.split(/\s+/).some((word) => word.startsWith(token)));
  }

  function filteredAds() {
    return appState.ads.filter((ad) => matchesCategory(ad) && matchesLocation(ad) && matchesQuery(ad));
  }

  function cardMarkup(ad, index) {
    const favorites = readFavorites();
    const active = favorites.has(ad.id);
    const image = ad.image || '';
    const badges = `${ad.featured ? '<span class="ehdx-badge featured">Featured</span>' : ''}${ad.promoted ? '<span class="ehdx-badge promoted">Promoted</span>' : ''}`;
    const condition = ad.condition && !/^(none|n\/a|not applicable)$/i.test(ad.condition) ? `<span class="ehdx-condition">${escapeHtml(ad.condition)}</span>` : '';
    return `
      <article class="ehdx-card" data-ad-id="${escapeHtml(ad.id)}">
        <a href="/ad/${encodeURIComponent(ad.id)}" class="ehdx-card-link" aria-label="${escapeHtml(ad.title)}">
          <div class="ehdx-image-wrap">
            <span class="ehdx-image-placeholder">${iconSvg('image')}</span>
            ${image ? `<img class="ehdx-image" src="${escapeHtml(image)}" alt="${escapeHtml(ad.title)}" width="480" height="360" loading="${index === 0 ? 'eager' : 'lazy'}" fetchpriority="${index === 0 ? 'high' : 'low'}" decoding="async">` : ''}
            ${badges ? `<div class="ehdx-badges">${badges}</div>` : ''}
          </div>
          <div class="ehdx-card-body">
            <h2 class="ehdx-card-title">${escapeHtml(ad.title)}</h2>
            <div class="ehdx-card-price">${escapeHtml(formatPrice(ad.price,ad.currency))}</div>
            <div class="ehdx-card-meta"><span>${iconSvg('pin')}${escapeHtml(ad.location)}</span><span>${iconSvg('clock')}${escapeHtml(relativeDate(ad.createdAt))}</span></div>
            ${condition}
          </div>
        </a>
        <button type="button" class="ehdx-heart${active ? ' active' : ''}" data-favorite-id="${escapeHtml(ad.id)}" aria-label="${active ? 'Remove from favorites' : 'Add to favorites'}">${iconSvg('heart')}</button>
      </article>`;
  }

  function render() {
    const grid = $('#ehdxGrid');
    const count = $('#ehdxCount');
    const title = $('#ehdxResultsTitle');
    const clear = $('#ehdxClear');
    if (!grid || !count || !title || !clear) return;

    const active = Boolean(appState.query || appState.category || appState.location);
    title.textContent = active ? 'Search Results' : 'Latest Ads';
    clear.classList.toggle('visible', active);

    if (!appState.loaded) {
      count.textContent = 'Loading listings...';
      return;
    }
    if (appState.failed) {
      count.textContent = 'Listings could not be loaded';
      grid.innerHTML = `<div class="ehdx-error"><h3>Could not load listings</h3><p>Please check your connection and try again.</p><button class="ehdx-retry" type="button" id="ehdxRetry">Try again</button></div>`;
      $('#ehdxRetry')?.addEventListener('click', loadData, { once:true });
      return;
    }

    const ads = filteredAds();
    count.textContent = `${ads.length} matching ad${ads.length === 1 ? '' : 's'} found`;
    grid.innerHTML = ads.length ? ads.map(cardMarkup).join('') : `<div class="ehdx-empty"><h3>No matching ads found</h3><p>Try changing the search, category or location.</p><button class="ehdx-retry" type="button" id="ehdxResetEmpty">Reset filters</button></div>`;
    $('#ehdxResetEmpty')?.addEventListener('click', clearFilters, { once:true });
    bindDynamicEvents();
  }

  function populateSelects() {
    const category = $('#ehdxCategory');
    const location = $('#ehdxLocation');
    if (category) {
      category.innerHTML = '<option value="">All categories</option>' + FALLBACK_CATEGORIES.map((row) => `<option value="${escapeHtml(row.key)}">${escapeHtml(row.label)}</option>`).join('');
      category.value = appState.category;
    }
    if (location) {
      const districtNames = Array.from(new Set(appState.districts.map((row) => row.name).filter(Boolean))).sort((a,b)=>a.localeCompare(b));
      location.innerHTML = '<option value="">Location</option>' + districtNames.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');
      location.value = appState.location;
    }
    $$('.ehdx-category').forEach((button) => {
      const active = button.dataset.ehdxCategory === appState.category;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
  }

  function bindEvents() {
    $('#ehdxSearchForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      appState.query = ($('#ehdxQuery')?.value || '').trim();
      appState.category = $('#ehdxCategory')?.value || '';
      appState.location = $('#ehdxLocation')?.value || '';
      populateSelects();
      render();
      $('#ehdxResultsTitle')?.scrollIntoView({ behavior:'smooth', block:'start' });
    });
    $('#ehdxQuery')?.addEventListener('input', (event) => {
      if (event.target.value) return;
      appState.query = '';
      render();
    });
    $('#ehdxCategory')?.addEventListener('change', (event) => {
      appState.category = event.target.value;
      populateSelects();
      render();
    });
    $('#ehdxLocation')?.addEventListener('change', (event) => {
      appState.location = event.target.value;
      render();
    });
    $('#ehdxCategories')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-ehdx-category]');
      if (!button) return;
      const key = button.dataset.ehdxCategory || '';
      appState.category = appState.category === key ? '' : key;
      populateSelects();
      render();
    });
    $('#ehdxClear')?.addEventListener('click', clearFilters);
  }

  function bindDynamicEvents() {
    $$('.ehdx-image').forEach((image) => image.addEventListener('error', () => image.classList.add('ehdx-image-error'), { once:true }));
    $$('.ehdx-heart').forEach((button) => button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const id = button.dataset.favoriteId;
      if (!id) return;
      const favorites = readFavorites();
      if (favorites.has(id)) {
        favorites.delete(id);
        button.classList.remove('active');
        button.setAttribute('aria-label','Add to favorites');
        showToast('Removed from favorites');
      } else {
        favorites.add(id);
        button.classList.add('active');
        button.setAttribute('aria-label','Remove from favorites');
        showToast('Added to favorites');
      }
      writeFavorites(favorites);
    }));
  }

  function clearFilters() {
    appState.query = '';
    appState.category = '';
    appState.location = '';
    const query = $('#ehdxQuery'); if (query) query.value = '';
    populateSelects();
    render();
  }

  function applyMeta(payload) {
    if (!payload || payload.ok === false) return;
    if (Array.isArray(payload.districts) && payload.districts.length) {
      appState.districts = payload.districts.filter((row) => row && row.name).map((row) => ({ id:String(row.id || row.slug || row.name),name:String(row.name),slug:slug(row.slug || row.name) }));
    }
    if (Array.isArray(payload.cities)) appState.cities = payload.cities;
    populateSelects();
  }

  async function fetchJson(url, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs || 12000);
    try {
      const response = await fetch(url, { headers:{ Accept:'application/json' }, credentials:'same-origin', signal:controller.signal });
      const payload = await response.json().catch(()=>({}));
      if (!response.ok || payload.ok === false) throw new Error(payload.message || `Request failed (${response.status})`);
      return payload;
    } finally { clearTimeout(timer); }
  }

  async function directSupabaseRows(select, includeStatusFilter) {
    const params = new URLSearchParams({
      select,
      order: 'created_at.desc',
      limit: '60'
    });
    if (includeStatusFilter) params.set('status', 'in.(approved,active,published)');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${PUBLIC_SUPABASE_URL}/rest/v1/ads?${params.toString()}`, {
        headers: {
          apikey: PUBLIC_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${PUBLIC_SUPABASE_ANON_KEY}`,
          Accept: 'application/json'
        },
        signal: controller.signal
      });
      const payload = await response.json().catch(() => []);
      if (!response.ok || !Array.isArray(payload)) {
        throw new Error(payload?.message || payload?.hint || `Supabase request failed (${response.status})`);
      }
      return payload;
    } finally {
      clearTimeout(timer);
    }
  }

  async function loadAdsDirectly() {
    const projections = [
      'id,title,description,price,currency,phone,condition,status,category_id,city_id,custom_fields,is_featured,is_promoted,promotion_type,image_url,created_at,updated_at',
      'id,title,description,price,phone,condition,status,category_id,city_id,custom_fields,image_url,created_at,updated_at',
      '*'
    ];
    let lastError = null;

    for (const select of projections) {
      try {
        const rows = await directSupabaseRows(select, true);
        return { ok: true, ads: rows };
      } catch (error) {
        lastError = error;
      }
    }

    // Compatibility for older rows whose status value has different casing.
    try {
      const rows = await directSupabaseRows('*', false);
      return {
        ok: true,
        ads: rows.filter((row) => PUBLIC_AD_STATUSES.has(String(row?.status || '').trim().toLowerCase())).slice(0, 60)
      };
    } catch (error) {
      lastError = error;
    }

    console.error('Direct Supabase listings fallback failed:', lastError);
    return { ok: false, ads: [] };
  }

  async function loadData() {
    appState.loaded = false;
    appState.failed = false;
    render();

    const [homeResult, metaResult] = await Promise.allSettled([
      fetchJson('/api/public-home', 15000),
      fetchJson('/api/public-meta', 15000)
    ]);
    if (metaResult.status === 'fulfilled') applyMeta(metaResult.value);

    let rows = [];
    let listingsLoaded = false;
    if (homeResult.status === 'fulfilled' && Array.isArray(homeResult.value.ads)) {
      rows = homeResult.value.ads;
      listingsLoaded = true;
    } else {
      console.warn('Marketplace API unavailable; using direct public Supabase fallback.', homeResult.reason || '');
      const fallback = await loadAdsDirectly();
      rows = fallback.ads;
      listingsLoaded = fallback.ok;
    }

    // An empty API response can be caused by a stale schema/cache query. Confirm
    // it once against public RLS before presenting a genuinely empty marketplace.
    if (listingsLoaded && rows.length === 0) {
      const fallback = await loadAdsDirectly();
      if (fallback.ok && fallback.ads.length) rows = fallback.ads;
    }

    appState.ads = rows.map(normalizeAd).filter((ad) => ad.id);
    appState.failed = !listingsLoaded;
    appState.loaded = true;
    render();
  }

  function lockDesktopOwnership() {
    document.documentElement.classList.add('ehm-desktop-home-exact');
    document.documentElement.setAttribute('data-ehm-home-owner', 'exact-compact-v7');
    const root = document.getElementById('root');
    const host = document.getElementById('ehmDesktopHomeExact');
    if (root) { root.hidden = true; root.setAttribute('aria-hidden', 'true'); }
    if (host) host.hidden = false;
  }

  lockDesktopOwnership();
  if (mount()) loadData();
  else document.addEventListener('DOMContentLoaded', () => { lockDesktopOwnership(); if (mount()) loadData(); }, { once:true });
})();
