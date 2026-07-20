(() => {
  'use strict';
  const app = document.getElementById('adApp');
  const match = location.pathname.replace(/\/+$/, '').match(/^\/ad\/([^/]+)$/);
  const adId = match ? decodeURIComponent(match[1]) : '';
  let currentSignature = '';

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const money = (value) => `LKR ${Math.round(Number(value || 0)).toLocaleString('en-LK')}`;
  const compactDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('en-LK', {year:'numeric',month:'short',day:'numeric'});
  };
  const phoneText = (value) => {
    const digits = String(value || '').replace(/\D/g, '');
    if (/^94\d{9}$/.test(digits)) return `+94 ${digits.slice(2,4)} ${digits.slice(4,7)} ${digits.slice(7)}`;
    return String(value || '');
  };

  function normalize(raw) {
    const custom = raw.customFields || raw.custom_fields || {};
    const seller = raw.seller || {};
    const images = Array.isArray(raw.images) ? raw.images.filter(Boolean) : (raw.image_url ? [raw.image_url] : []);
    const phones = Array.from(new Set([
      ...(Array.isArray(raw.contactPhones) ? raw.contactPhones : []),
      raw.contactPhone, raw.phone, seller.phone,
      ...(Array.isArray(custom.contact_phones) ? custom.contact_phones : [])
    ].filter(Boolean)));
    return {
      ...raw,
      id: String(raw.id || adId),
      title: raw.title || 'Untitled Ad',
      description: raw.description || '',
      price: Number(raw.price || 0),
      images,
      location: raw.location || [raw.city || custom.city, raw.district || custom.district].filter(Boolean).join(', '),
      categoryId: raw.categoryId || custom.category_slug || '',
      subcategoryId: raw.subcategoryId || custom.subcategory_slug || '',
      condition: String(raw.condition || '').toLowerCase(),
      sellerName: raw.sellerName || seller.name || custom.owner_name || 'Seller',
      contactPhones: phones,
      contactEmail: raw.contactEmail || seller.email || custom.owner_contact_email || '',
      createdAt: raw.createdAt || raw.created_at || raw.postedAt || custom.submitted_at || '',
      viewCount: Number(raw.viewCount || raw.views || 0)
    };
  }

  function isVehicle(ad) {
    return String(ad.categoryId || '').includes('vehicle') ||
      ['cars','vans','suvs','motorbikes','three-wheelers','buses','lorries','boats','heavy-equipment'].includes(String(ad.subcategoryId || ''));
  }

  function finance(ad) {
    if (!isVehicle(ad) || !ad.price) return '';
    const down = Math.round(ad.price * .4);
    const principal = ad.price - down;
    const rate = .15 / 12;
    const months = 48;
    const monthly = Math.round(principal * rate * Math.pow(1 + rate, months) / (Math.pow(1 + rate, months) - 1));
    return `<section class="finance"><h3>Vehicle Finance Estimate</h3><div><span>Down Payment</span><strong>${money(down)}</strong></div><div><span>Monthly Payment</span><strong>${money(monthly)}</strong></div><div><span>Finance Company</span><a href="tel:+94770000000">+94 77 000 0000</a></div></section>`;
  }

  function similarCards(rows, ad) {
    const similar = rows.filter((row) => String(row.id) !== String(ad.id) && row.categoryId === ad.categoryId).slice(0, 3);
    if (!similar.length) return '';
    return `<section class="similar-section"><h2>Similar Ads</h2><div class="similar-grid">${similar.map((row) => {
      const item = normalize(row);
      return `<a class="similar-card" href="/ad/${encodeURIComponent(item.id)}"><img src="${esc(item.images[0] || '')}" loading="lazy" decoding="async" alt=""><div><h3>${esc(item.title)}</h3><strong>${money(item.price)}</strong></div></a>`;
    }).join('')}</div></section>`;
  }

  function render(raw, staticRows = []) {
    const ad = normalize(raw);
    const signature = JSON.stringify([ad.id, ad.title, ad.price, ad.images[0], ad.description]);
    if (signature === currentSignature) return;
    currentSignature = signature;
    document.title = `${ad.title} | ehemehe.lk`;
    const image = ad.images[0] || '';
    const phoneLinks = ad.contactPhones.map((phone, index) => `<a href="tel:${esc(String(phone).replace(/[^+\d]/g,''))}"><span>${index ? `Contact ${index + 1}` : 'Primary Number'}</span><strong>${esc(phoneText(phone))}</strong></a>`).join('');
    app.innerHTML = `<nav class="breadcrumb"><a href="/">Home</a><span>›</span><span>${esc(ad.title)}</span></nav><div class="ad-layout"><div class="ad-main"><section class="gallery">${image ? `<img src="${esc(image)}" fetchpriority="high" decoding="async" alt="${esc(ad.title)}">` : '<div class="no-image">No photo available</div>'}<span class="image-count">1 / ${Math.max(1, ad.images.length)}</span></section><section class="ad-card"><div class="title-row"><h1>${esc(ad.title)}</h1><button class="favorite" type="button" aria-label="Save ad">♡</button></div><div class="price">${money(ad.price)}</div>${finance(ad)}<div class="meta">${ad.condition ? `<span>${esc(ad.condition === 'new' ? 'New' : ad.condition === 'used' ? 'Used' : ad.condition)}</span>` : ''}${ad.location ? `<span>⌖ ${esc(ad.location)}</span>` : ''}${ad.createdAt ? `<span>◷ ${esc(compactDate(ad.createdAt))}</span>` : ''}${ad.viewCount ? `<span>◉ ${esc(ad.viewCount)} views</span>` : ''}</div><div class="description"><h2>Description</h2><p>${esc(ad.description)}</p></div></section>${similarCards(staticRows, ad)}</div><aside class="seller-card"><div class="seller-head"><div class="avatar">${esc(ad.sellerName.charAt(0).toUpperCase())}</div><div><strong>${esc(ad.sellerName)}</strong><small>Seller</small></div></div>${phoneLinks ? `<div class="phones">${phoneLinks}</div><a class="call-now" href="tel:${esc(String(ad.contactPhones[0]).replace(/[^+\d]/g,''))}">Call Now</a>` : ''}${ad.contactEmail ? `<a class="email-seller" href="mailto:${esc(ad.contactEmail)}">Send Message</a>` : ''}<p class="safety">♢ Never pay outside ehemehe.lk</p></aside></div>`;
    window.scrollTo(0, 0);
  }

  function renderError() {
    if (currentSignature) return;
    app.innerHTML = `<section class="error-card"><h1>Ad could not be loaded</h1><p>The listing may have been removed, or the connection took too long.</p><div class="error-actions"><button type="button" onclick="location.reload()">Try Again</button><a href="/">Go Home</a></div></section>`;
  }

  async function fetchJson(url, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || `HTTP ${response.status}`);
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  async function boot() {
    if (!adId) return renderError();
    const remote = await fetchJson(`/api/public-ad?id=${encodeURIComponent(adId)}`, 7000)
      .then((data) => {
        if (data?.ad) render(data.ad, []);
        return data?.ad || null;
      }).catch(() => null);
    if (!remote) renderError();
  }

  boot();
})();
