(function () {
  'use strict';

  var BUILD = 'desktop-home-v4-20260718';
  var path = location.pathname.replace(/\/index\.html$/i, '/').replace(/\/+$/, '') || '/';
  var desktop = !!(window.matchMedia && window.matchMedia('(min-width: 768px)').matches);
  if (path !== '/' || !desktop) return;

  window.__EHM_DESKTOP_THEME_BUILD = BUILD;
  document.documentElement.classList.add('ehm-home-route-prepaint', 'ehm-desktop-home-prepaint');
  document.documentElement.setAttribute('data-ehm-desktop-theme', BUILD);

  var CATEGORY_OPTIONS = [
    'All Categories', 'Vehicles', 'Property', 'Mobile Phones & Tablets', 'Electronics',
    'Home & Garden', 'Fashion', 'Health & Beauty', 'Sports, Hobbies & Kids',
    'Animals & Pets', 'Jobs', 'Services', 'Education', 'Business, Industry & Agriculture'
  ];
  var LOCATION_OPTIONS = [
    'All of Sri Lanka', 'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
    'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle',
    'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Monaragala',
    'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura',
    'Trincomalee', 'Vavuniya'
  ];

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function optionHtml(rows, firstValue) {
    return rows.map(function (label, index) {
      return '<option value="' + (index ? escapeHtml(label) : '') + '">' + escapeHtml(label || firstValue) + '</option>';
    }).join('');
  }

  function findHeroInput() {
    var inputs = Array.prototype.slice.call(document.querySelectorAll('input[placeholder]'));
    return inputs.find(function (input) {
      var placeholder = input.getAttribute('placeholder') || '';
      return /search for anything|what are you looking/i.test(placeholder);
    }) || null;
  }

  function hideCompetingControls(section, input) {
    if (!section) return;
    Array.prototype.slice.call(section.querySelectorAll('select')).forEach(function (select) {
      if (select.id && select.id.indexOf('ehmDesktopHero') === 0) return;
      if (select.closest && select.closest('#ehmDesktopHeroFilterbar')) return;
      var text = Array.prototype.slice.call(select.options || []).map(function (option) {
        return option.textContent || '';
      }).join(' ');
      if (/All Locations|All Districts|Colombo|Kandy|Galle|Gampaha|Matara/i.test(text)) {
        select.classList.add('ehm-desktop-top-location-hidden');
        var wrapper = select.parentElement;
        if (wrapper && !wrapper.contains(input)) wrapper.classList.add('ehm-desktop-native-location-hidden');
      }
    });
  }

  function arrangeSections() {
    var root = document.getElementById('root');
    if (!root) return;
    var sections = Array.prototype.slice.call(root.querySelectorAll('section'));
    var browse = null;
    var hero = null;

    sections.forEach(function (section) {
      var heading = section.querySelector('h2');
      var label = String(heading && heading.textContent || '').trim();
      var text = String(section.textContent || '');
      if (label === 'Browse Categories') browse = section;
      if (/What are you looking for|Sri Lanka's #1 Modern Marketplace/i.test(text)) hero = hero || section;
      if ((label === 'Featured Ads' || label === 'Latest Ads') && section.id !== 'ehmDesktopResults') {
        section.style.setProperty('display', 'none', 'important');
      }
    });

    var host = document.getElementById('ehmDesktopResults');
    if (!host) {
      host = document.createElement('section');
      host.id = 'ehmDesktopResults';
      host.className = 'ehm-desktop-results ehm-critical-results-placeholder';
      host.innerHTML = '<div class="ehm-desktop-results-head"><div><h2>Latest Ads</h2><p>Loading the newest listings…</p></div></div>' +
        '<div class="ehm-critical-card-grid" aria-hidden="true">' +
        '<i></i><i></i><i></i><i></i></div>';
    }
    var anchor = browse || hero;
    if (anchor && (host.parentElement !== anchor.parentElement || host.previousElementSibling !== anchor)) {
      anchor.insertAdjacentElement('afterend', host);
    }
  }

  function applyShell() {
    if (window.__EHM_DESKTOP_SHELL_READY === BUILD) return true;
    var input = findHeroInput();
    if (!input) return false;
    var section = input.closest('section') || input.parentElement;
    hideCompetingControls(section, input);

    var bar = document.getElementById('ehmDesktopHeroFilterbar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'ehmDesktopHeroFilterbar';
      bar.className = 'ehm-desktop-hero-filterbar ehm-critical-desktop-filterbar';
      var searchWrap = input.closest('form') || input.parentElement;
      var parent = searchWrap && searchWrap.parentElement || searchWrap || input;
      parent.insertAdjacentElement('afterend', bar);
    }

    if (!bar.querySelector('#ehmDesktopHeroCategory')) {
      bar.innerHTML = '<select class="ehm-desktop-category-select" id="ehmDesktopHeroCategory" aria-label="Category">' +
        optionHtml(CATEGORY_OPTIONS, 'All Categories') + '</select>' +
        '<select class="ehm-desktop-district-select" id="ehmDesktopHeroLocation" aria-label="Location">' +
        optionHtml(LOCATION_OPTIONS, 'All of Sri Lanka') + '</select>';
    }

    arrangeSections();
    document.documentElement.classList.add('ehm-desktop-theme-v4-ready');
    return true;
  }

  var queued = false;
  function schedule() {
    if (queued || window.__EHM_DESKTOP_SHELL_READY === BUILD) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      applyShell();
    });
  }

  var observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.__ehmCriticalDesktopObserver = observer;
  window.setTimeout(function () {
    if (window.__ehmCriticalDesktopObserver === observer) {
      observer.disconnect();
      window.__ehmCriticalDesktopObserver = null;
    }
  }, 15000);

  applyShell();
  document.addEventListener('DOMContentLoaded', applyShell, { once: true });
  window.addEventListener('pageshow', schedule);
})();
