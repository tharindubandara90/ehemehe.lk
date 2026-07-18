(function () {
  'use strict';

  var BUILD = 'desktop-olx-home-v1-20260718';
  var media = window.matchMedia && window.matchMedia('(min-width: 1024px)');
  if (!media || !media.matches) return;

  var initialPath = location.pathname.replace(/\/index\.html$/i, '/').replace(/\/+$/, '') || '/';
  var initialWasHome = initialPath === '/';
  var initialized = false;
  var dataStarted = false;

  function isHomeRoute() {
    return (location.pathname.replace(/\/index\.html$/i, '/').replace(/\/+$/, '') || '/') === '/';
  }

  function markHomeActive() {
    window.__EHM_DESKTOP_OLX_HOME = true;
    window.__EHM_DESKTOP_THEME_BUILD = BUILD;
    document.documentElement.classList.add('ehm-desktop-olx-home-active');
    document.documentElement.setAttribute('data-ehm-desktop-theme', BUILD);
  }

  function markHomeInactive() {
    window.__EHM_DESKTOP_OLX_HOME = false;
    document.documentElement.classList.remove('ehm-desktop-olx-home-active');
    document.body && document.body.classList.remove('ehm-desktop-olx-home-body');
    var shell = document.getElementById('ehmDesktopOlxHome');
    if (shell) shell.setAttribute('aria-hidden', 'true');
  }

  if (initialWasHome) markHomeActive();

  var CATEGORY_ICONS = {
    vehicles: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 16h14l-1.5-5.2A2.5 2.5 0 0 0 15.1 9H8.9a2.5 2.5 0 0 0-2.4 1.8L5 16Z"/><path d="M4 16v2.2M20 16v2.2M7.5 18.5h.01M16.5 18.5h.01M8 9l1-3h6l1 3"/></svg>',
    property: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-7 9 7"/><path d="M5.5 10v9h13v-9M9.5 19v-5h5v5"/></svg>',
    'mobile-phones': '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M10 5h4M11 18.5h2"/></svg>',
    electronics: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    jobs: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2"/></svg>',
    services: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-3-3 2.4-2.4Z"/></svg>',
    'home-garden': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16v8H4zM7 12V8a5 5 0 0 1 10 0v4M8 20v2M16 20v2"/></svg>',
    fashion: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 4 4 2 4-2 4 4-3 3v9H7v-9L4 8l4-4Z"/><path d="M10 6v3h4V6"/></svg>'
  };

  var CATEGORY_ITEMS = [
    { slug: 'vehicles', label: 'Vehicles' },
    { slug: 'property', label: 'Property' },
    { slug: 'mobile-phones', label: 'Phones' },
    { slug: 'electronics', label: 'Electronics' },
    { slug: 'jobs', label: 'Jobs' },
    { slug: 'services', label: 'Services' },
    { slug: 'home-garden', label: 'Home & Garden' },
    { slug: 'fashion', label: 'Fashion' }
  ];

  var FALLBACK_DISTRICTS = [
    'All Sri Lanka','Ampara','Anuradhapura','Badulla','Batticaloa','Colombo','Galle','Gampaha',
    'Hambantota','Jaffna','Kalutara','Kandy','Kegalle','Kilinochchi','Kurunegala','Mannar',
    'Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya','Polonnaruwa','Puttalam',
    'Ratnapura','Trincomalee','Vavuniya'
  ];

  var state = {
    ads: [],
    filtered: [],
    categories: [],
    districts: [],
    loaded: false,
    query: '',
    category: '',
    location: ''
  };

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function slugify(value) {
    return String(value || '').toLowerCase().replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function parseObject(value) {
    if (!value) return {};
    if (typeof value === 'object' && !Array.isArray(value)) return value;
    try {
      var parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function readFavorites() {
    try {
      var value = JSON.parse(localStorage.getItem('ehemehe:favorites:v2') || '[]');
      return new Set(Array.isArray(value) ? value.map(String) : []);
    } catch (_) {
      return new Set();
    }
  }

  function writeFavorites(ids) {
    try { localStorage.setItem('ehemehe:favorites:v2', JSON.stringify(Array.from(ids))); } catch (_) {}
  }

  function customValue(custom, keys) {
    for (var i = 0; i < keys.length; i += 1) {
      var value = custom[keys[i]];
      if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
    }
    return '';
  }

  function normalizeAd(row) {
    var custom = parseObject(row.custom_fields);
    var categoryName = customValue(custom, ['category_name','categoryName','category']);
    var categorySlug = customValue(custom, ['category_slug','categorySlug']) || slugify(categoryName || row.category_id || '');
    var city = customValue(custom, ['city_name','cityName','city','town']);
    var district = customValue(custom, ['district_name','districtName','district']);
    var locationLabel = city || district || 'Sri Lanka';
    return {
      id: String(row.id || ''),
      title: String(row.title || 'Untitled listing'),
      description: String(row.description || ''),
      price: Number(row.price || 0),
      currency: String(row.currency || 'LKR'),
      image: String(row.image_url || ''),
      categorySlug: slugify(categorySlug),
      categoryName: categoryName || categorySlug || 'Marketplace',
      district: district,
      city: city,
      location: locationLabel,
      createdAt: row.created_at || row.updated_at || '',
      featured: row.is_featured === true || String(row.is_featured) === 'true',
      promoted: row.is_promoted === true || String(row.is_promoted) === 'true'
    };
  }

  function money(ad) {
    var value = Number(ad.price || 0);
    var formatted = Number.isFinite(value) ? value.toLocaleString('en-LK', { maximumFractionDigits: 0 }) : '0';
    return (ad.currency || 'LKR') + ' ' + formatted;
  }

  function relativeDate(value) {
    var time = new Date(value || '').getTime();
    if (!Number.isFinite(time)) return 'Recently';
    var days = Math.floor((Date.now() - time) / 86400000);
    if (days <= 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return days + ' days ago';
    return new Date(time).toLocaleDateString('en-LK', { month: 'short', day: 'numeric' });
  }

  function categoryOptions() {
    var rows = state.categories.length ? state.categories : CATEGORY_ITEMS.map(function (item) {
      return { slug: item.slug, name: item.label };
    });
    var unique = new Map();
    rows.forEach(function (row) {
      var slug = slugify(row.slug || row.name);
      if (!slug || row.parent_id || unique.has(slug)) return;
      unique.set(slug, row.name || row.slug);
    });
    return '<option value="">All categories</option>' + Array.from(unique.entries()).map(function (entry) {
      return '<option value="' + esc(entry[0]) + '">' + esc(entry[1]) + '</option>';
    }).join('');
  }

  function locationOptions() {
    var rows = state.districts.length ? state.districts.map(function (row) { return row.name; }) : FALLBACK_DISTRICTS.slice(1);
    var seen = new Set();
    return '<option value="">Location</option>' + rows.filter(function (name) {
      var key = String(name || '').toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key); return true;
    }).map(function (name) {
      return '<option value="' + esc(name) + '">' + esc(name) + '</option>';
    }).join('');
  }

  function skeletonCards(count) {
    var html = '';
    for (var i = 0; i < count; i += 1) {
      html += '<article class="ehm-olx-card ehm-olx-card-skeleton" aria-hidden="true">' +
        '<div class="ehm-olx-skeleton-image"></div><div class="ehm-olx-card-body">' +
        '<i></i><i></i><i></i></div></article>';
    }
    return html;
  }

  function cardHtml(ad, index) {
    var favorites = readFavorites();
    var active = favorites.has(ad.id);
    var badges = '';
    if (ad.featured) badges += '<span class="ehm-olx-badge featured">Featured</span>';
    if (ad.promoted) badges += '<span class="ehm-olx-badge promoted">Promoted</span>';
    var image = ad.image || '/assets/ehemehe_favicon.png';
    return '<article class="ehm-olx-card" data-ad-id="' + esc(ad.id) + '">' +
      '<a class="ehm-olx-card-link" href="/ad/' + encodeURIComponent(ad.id) + '" aria-label="' + esc(ad.title) + '">' +
        '<div class="ehm-olx-card-media">' +
          '<img src="' + esc(image) + '" alt="' + esc(ad.title) + '" width="480" height="300" ' +
            (index === 0 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy" fetchpriority="low"') + ' decoding="async">' +
          '<div class="ehm-olx-badges">' + badges + '</div>' +
        '</div>' +
        '<div class="ehm-olx-card-body">' +
          '<h3>' + esc(ad.title) + '</h3>' +
          '<strong>' + esc(money(ad)) + '</strong>' +
          '<p><span>' + esc(ad.location) + '</span><span>' + esc(relativeDate(ad.createdAt)) + '</span></p>' +
        '</div>' +
      '</a>' +
      '<button class="ehm-olx-heart' + (active ? ' active' : '') + '" type="button" data-favorite-id="' + esc(ad.id) + '" aria-label="' + (active ? 'Remove from favourites' : 'Add to favourites') + '" aria-pressed="' + (active ? 'true' : 'false') + '">' + (active ? '♥' : '♡') + '</button>' +
    '</article>';
  }

  function renderCategories() {
    var host = document.getElementById('ehmOlxCategories');
    if (!host) return;
    host.innerHTML = CATEGORY_ITEMS.map(function (item) {
      return '<button type="button" class="ehm-olx-category" data-category-shortcut="' + esc(item.slug) + '">' +
        '<span class="ehm-olx-category-icon">' + (CATEGORY_ICONS[item.slug] || '') + '</span>' +
        '<span>' + esc(item.label) + '</span>' +
      '</button>';
    }).join('');
  }

  function applyFilters() {
    var query = state.query.trim().toLowerCase();
    var category = slugify(state.category);
    var location = state.location.trim().toLowerCase();
    state.filtered = state.ads.filter(function (ad) {
      if (query) {
        var haystack = [ad.title, ad.description, ad.categoryName, ad.location].join(' ').toLowerCase();
        var tokens = query.split(/\s+/).filter(Boolean);
        if (!tokens.every(function (token) { return haystack.indexOf(token) !== -1; })) return false;
      }
      if (category && ad.categorySlug !== category && ad.categorySlug.indexOf(category) !== 0) return false;
      if (location) {
        var adLocation = [ad.district, ad.city, ad.location].join(' ').toLowerCase();
        if (adLocation.indexOf(location) === -1) return false;
      }
      return true;
    });
    renderListings();
  }

  function renderListings() {
    var grid = document.getElementById('ehmOlxGrid');
    var heading = document.getElementById('ehmOlxResultsTitle');
    var count = document.getElementById('ehmOlxResultsCount');
    if (!grid || !heading || !count) return;

    var active = !!(state.query || state.category || state.location);
    heading.textContent = active ? 'Search results' : 'Fresh recommendations';

    if (!state.loaded) {
      count.textContent = 'Loading the newest listings';
      grid.innerHTML = skeletonCards(8);
      return;
    }

    var rows = state.filtered;
    count.textContent = rows.length + (rows.length === 1 ? ' listing found' : ' listings found');
    if (!rows.length) {
      grid.innerHTML = '<div class="ehm-olx-empty"><h3>No matching ads found</h3><p>Try changing the search, category or location.</p><button type="button" id="ehmOlxReset">Reset filters</button></div>';
      return;
    }
    grid.innerHTML = rows.slice(0, 24).map(cardHtml).join('');
  }

  function syncControls() {
    var search = document.getElementById('ehmOlxSearchInput');
    var category = document.getElementById('ehmOlxCategorySelect');
    var location = document.getElementById('ehmOlxLocationSelect');
    if (search) search.value = state.query;
    if (category) {
      category.innerHTML = categoryOptions();
      category.value = state.category;
    }
    if (location) {
      location.innerHTML = locationOptions();
      location.value = state.location;
    }
  }

  function setReady() {
    var shell = document.getElementById('ehmDesktopOlxHome');
    if (!shell) return false;
    shell.removeAttribute('aria-hidden');
    shell.dataset.ready = '1';
    document.body.classList.add('ehm-desktop-olx-home-body');
    renderCategories();
    syncControls();
    renderListings();
    return true;
  }

  async function loadData() {
    try {
      var response = await fetch('/api/public-home', { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
      var payload = await response.json();
      state.ads = Array.isArray(payload.ads) ? payload.ads.map(normalizeAd).filter(function (ad) { return ad.id; }) : [];
    } catch (_) {
      state.ads = [];
    }
    state.loaded = true;
    state.filtered = state.ads.slice();
    renderListings();

    try {
      var metaResponse = await fetch('/api/public-meta', { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
      var meta = await metaResponse.json();
      state.categories = Array.isArray(meta.categories) ? meta.categories : [];
      state.districts = Array.isArray(meta.districts) ? meta.districts : [];
      syncControls();
    } catch (_) {}
  }

  function bindEvents() {
    document.addEventListener('submit', function (event) {
      if (!event.target || event.target.id !== 'ehmOlxSearchForm') return;
      event.preventDefault();
      var search = document.getElementById('ehmOlxSearchInput');
      var category = document.getElementById('ehmOlxCategorySelect');
      var location = document.getElementById('ehmOlxLocationSelect');
      state.query = search ? search.value : '';
      state.category = category ? category.value : '';
      state.location = location ? location.value : '';
      applyFilters();
      document.getElementById('ehmOlxResults')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.addEventListener('click', function (event) {
      var shortcut = event.target && event.target.closest && event.target.closest('[data-category-shortcut]');
      if (shortcut) {
        state.category = shortcut.getAttribute('data-category-shortcut') || '';
        state.query = '';
        var category = document.getElementById('ehmOlxCategorySelect');
        var search = document.getElementById('ehmOlxSearchInput');
        if (category) category.value = state.category;
        if (search) search.value = '';
        applyFilters();
        document.getElementById('ehmOlxResults')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      var favorite = event.target && event.target.closest && event.target.closest('[data-favorite-id]');
      if (favorite) {
        event.preventDefault();
        event.stopPropagation();
        var id = String(favorite.getAttribute('data-favorite-id') || '');
        var ids = readFavorites();
        var active = ids.has(id);
        if (active) ids.delete(id); else ids.add(id);
        writeFavorites(ids);
        favorite.classList.toggle('active', !active);
        favorite.textContent = active ? '♡' : '♥';
        favorite.setAttribute('aria-pressed', String(!active));
        favorite.setAttribute('aria-label', active ? 'Add to favourites' : 'Remove from favourites');
        return;
      }

      if (event.target && event.target.id === 'ehmOlxReset') {
        state.query = '';
        state.category = '';
        state.location = '';
        syncControls();
        applyFilters();
      }
    });
  }

  function init() {
    if (initialized || !isHomeRoute()) return;
    markHomeActive();
    if (!setReady()) return;
    initialized = true;
    bindEvents();
    if (!dataStarted) {
      dataStarted = true;
      loadData();
    }
  }

  function activateCurrentRoute() {
    if (isHomeRoute()) {
      // A React route that reaches / from another page can carry the old home
      // component and its helper observers. Reload once so the independent
      // marketplace shell becomes the only desktop-home implementation.
      if (!initialWasHome) {
        location.reload();
        return;
      }
      markHomeActive();
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
      else init();
    } else {
      markHomeInactive();
    }
  }

  document.addEventListener('click', function (event) {
    if (isHomeRoute()) return;
    var link = event.target && event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    var target;
    try { target = new URL(link.href, location.href); } catch (_) { return; }
    if (target.origin === location.origin && (target.pathname === '/' || target.pathname === '/index.html')) {
      event.preventDefault();
      location.href = '/';
    }
  }, true);

  window.addEventListener('popstate', activateCurrentRoute);
  window.addEventListener('pageshow', activateCurrentRoute);
  activateCurrentRoute();

  if (media.addEventListener) {
    media.addEventListener('change', function (event) {
      if (!event.matches) location.reload();
    });
  }
})();
