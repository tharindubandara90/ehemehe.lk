(() => {
  'use strict';

  let primaryAdImageAssigned = false;

  function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function inferredButtonLabel(button) {
    const existing = cleanText(button.getAttribute('aria-label'));
    if (existing) return existing;
    const title = cleanText(button.getAttribute('title'));
    if (title) return title;
    const text = cleanText(button.textContent);
    if (text) return text;

    const signature = [button.id, button.className, button.getAttribute('data-action'), button.getAttribute('data-testid')]
      .map(cleanText).join(' ').toLowerCase();
    if (/previous|prev|left/.test(signature)) return 'Previous image';
    if (/next|right/.test(signature)) return 'Next image';
    if (/favorite|favourite|heart|save/.test(signature)) return 'Save ad';
    if (/close|dismiss/.test(signature)) return 'Close';
    if (/search/.test(signature)) return 'Search';
    if (/grid/.test(signature)) return 'Grid view';
    if (/list/.test(signature)) return 'List view';
    if (/menu/.test(signature)) return 'Open menu';
    if (/location|district|city/.test(signature)) return 'Choose location';
    return 'Action';
  }

  function improveButton(button) {
    if (!(button instanceof HTMLButtonElement)) return;
    if (!button.hasAttribute('aria-label') && !cleanText(button.textContent)) {
      button.setAttribute('aria-label', inferredButtonLabel(button));
    }
  }

  function isAdImage(image) {
    const src = String(image.currentSrc || image.getAttribute('src') || '');
    return /\/api\/ad-image(?:\?|$)/.test(src);
  }

  function isLogoImage(image) {
    const src = String(image.currentSrc || image.getAttribute('src') || '');
    return /ehemehe_(?:logo|logo_header)\.png/i.test(src);
  }

  function improveImage(image) {
    if (!(image instanceof HTMLImageElement)) return;
    image.decoding = 'async';

    if (isLogoImage(image)) {
      if (!image.hasAttribute('width')) image.setAttribute('width', '1800');
      if (!image.hasAttribute('height')) image.setAttribute('height', '425');
      return;
    }

    if (!isAdImage(image)) return;

    if (!image.hasAttribute('width')) image.setAttribute('width', '640');
    if (!image.hasAttribute('height')) image.setAttribute('height', '480');

    const path = location.pathname.replace(/\/+$/, '') || '/';
    const isDetailMain = path.startsWith('/ad/') && (
      image.matches('[data-gallery-main], [data-ehm-detail-main-image], #ehmDynamicMainImage') ||
      image.closest('.gallery, .ehm-dynamic-main-image')
    );
    const isHome = path === '/' || path === '/index.html';

    if (isDetailMain || (isHome && !primaryAdImageAssigned)) {
      primaryAdImageAssigned = true;
      image.loading = 'eager';
      image.setAttribute('fetchpriority', 'high');
    } else if (!image.hasAttribute('loading')) {
      image.loading = 'lazy';
    }
  }

  function improveTree(root) {
    if (!root || root.nodeType !== 1) return;
    if (root.matches?.('img')) improveImage(root);
    if (root.matches?.('button')) improveButton(root);
    root.querySelectorAll?.('img').forEach(improveImage);
    root.querySelectorAll?.('button').forEach(improveButton);
  }

  function boot() {
    improveTree(document.documentElement);
    const observer = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach(improveTree));
    });
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
    window.__ehmPerformanceSafeObserver = observer;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
