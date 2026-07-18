(() => {
  'use strict';

  const POST_ROUTES = new Set(['/post', '/post-ad']);
  const PHONE_STATE_KEY = 'ehemehe:reactPostPhones:v2';
  const IMAGE_STATE_KEY = 'ehemehe:reactPostImages:v2';
  const LOCAL_ADS_KEY = 'ehemehe:userSubmittedAds:v2';
  const POST_DRAFT_KEY = 'ehemehe:reactPostDraft:v1';
  const CATEGORY_FORM_KEY = 'ehemehe:postAdForm:v4';
  const CATEGORY_SELECTION_KEY = 'ehemehe:postAdSelection:v1';
  const MAX_PHONES = 5;
  const MAX_IMAGES = 10;

  const runtime = {
    rows: [],
    images: [],
    phoneProof: '',
    publishing: false,
    dashboardLoading: false,
    dashboardLoadedAt: 0,
    dashboardAds: [],
    authChecking: false,
    authAllowed: false,
    authRedirected: false,
    tickRunning: false,
    tickQueued: false
  };

  const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
  const labelKey = (value) => clean(clean(value).replace(/\*/g, '')).toLowerCase();
  const route = () => (location.pathname.replace(/\/+$/, '') || '/');
  const isPostRoute = () => POST_ROUTES.has(route());
  const isRuntimeRoute = () => isPostRoute() || route().startsWith('/dashboard');

  function installRouteChangeEvents() {
    if (window.__ehmRouteChangeEventsInstalled) return;
    window.__ehmRouteChangeEventsInstalled = true;

    const emit = () => window.dispatchEvent(new Event('ehemehe:routechange'));
    for (const method of ['pushState', 'replaceState']) {
      const original = history[method];
      if (typeof original !== 'function') continue;
      history[method] = function ehmHistoryRouteChange(...args) {
        const result = original.apply(this, args);
        emit();
        return result;
      };
    }
    window.addEventListener('popstate', emit);
  }
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[c]));
  const slug = (value) => String(value || '')
    .toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  function otpClient() {
    const client = window.EHM_SMS?.otp || window.EHM_OTP;
    if (!client || typeof client.request !== 'function' || typeof client.verify !== 'function') {
      throw new Error('SMS verification service could not start. Reload the page once.');
    }
    return client;
  }

  function readJsonStorage(storage, key, fallback) {
    try {
      const parsed = JSON.parse(storage.getItem(key) || 'null');
      return parsed === null ? fallback : parsed;
    } catch (_) {
      return fallback;
    }
  }

  function savePhoneState() {
    try {
      sessionStorage.setItem(PHONE_STATE_KEY, JSON.stringify({
        rows: runtime.rows,
        phoneProof: runtime.phoneProof
      }));
    } catch (_) {}
  }

  function saveImages() {
    try {
      const encoded = JSON.stringify(runtime.images);
      if (encoded.length < 3_700_000) sessionStorage.setItem(IMAGE_STATE_KEY, encoded);
    } catch (_) {}
  }

  function restoreRuntimeState() {
    const phoneState = readJsonStorage(sessionStorage, PHONE_STATE_KEY, {});
    runtime.rows = Array.isArray(phoneState.rows) ? phoneState.rows.slice(0, MAX_PHONES) : [];
    runtime.phoneProof = String(phoneState.phoneProof || '');
    runtime.images = readJsonStorage(sessionStorage, IMAGE_STATE_KEY, []);
    if (!Array.isArray(runtime.images)) runtime.images = [];

    runtime.rows.forEach((row) => {
      if (row.verifiedToken) {
        try { otpClient().restore(row.value, row.purpose, row.verifiedToken); } catch (_) {}
      }
    });
  }

  function heading(text) {
    const wanted = labelKey(text);
    return Array.from(document.querySelectorAll('h1,h2,h3'))
      .find((node) => labelKey(node.textContent) === wanted) || null;
  }

  function labeledControl(container, text, selector = 'input,select,textarea') {
    if (!container) return null;
    const wanted = labelKey(text);
    for (const label of container.querySelectorAll('label')) {
      if (labelKey(label.textContent) !== wanted) continue;
      if (label.htmlFor) {
        const associated = document.getElementById(label.htmlFor);
        if (associated?.matches(selector)) return associated;
      }
      const field = label.parentElement?.querySelector(selector);
      if (field) return field;
    }
    return null;
  }

  function nativeSetInput(input, value) {
    if (!input) return;
    const proto = input instanceof HTMLSelectElement
      ? HTMLSelectElement.prototype
      : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(input, value);
    else input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function message(text, type = 'error') {
    let node = document.getElementById('ehm-post-runtime-message');
    if (!node) {
      node = document.createElement('div');
      node.id = 'ehm-post-runtime-message';
      node.className = 'ehm-post-runtime-message';
      const card = heading('Contact & Location')?.parentElement ||
        heading('Review Your Ad')?.parentElement ||
        heading('Add Photos')?.parentElement;
      card?.appendChild(node);
    }
    if (!node) return;
    node.textContent = text || '';
    node.className = `ehm-post-runtime-message ${type}`;
    if (text) node.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // -------------------------- Image browser -------------------------------

  function fileToImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Could not read ${file.name || 'the selected image'}.`));
      };
      img.src = url;
    });
  }

  async function optimizedImage(file, maxDimension = 1600, quality = 0.88) {
    if (!file?.type?.startsWith('image/')) {
      throw new Error('Select image files only.');
    }

    let source;
    let width;
    let height;
    try {
      source = await createImageBitmap(file);
      width = source.width;
      height = source.height;
    } catch (_) {
      source = await fileToImage(file);
      width = source.naturalWidth;
      height = source.naturalHeight;
    }

    if (!width || !height) throw new Error('The selected image could not be decoded.');

    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const outputWidth = Math.max(1, Math.round(width * scale));
    const outputHeight = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const context = canvas.getContext('2d', { alpha: false });
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.fillStyle = '#fff';
    context.fillRect(0, 0, outputWidth, outputHeight);
    context.drawImage(source, 0, 0, outputWidth, outputHeight);
    if (typeof source.close === 'function') source.close();

    const webp = canvas.toDataURL('image/webp', quality);
    if (webp.startsWith('data:image/webp')) return webp;
    return canvas.toDataURL('image/jpeg', quality);
  }

  window.ehmPostAdImagePicker = function ehmPostAdImagePicker(existingImages, setImages) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/heic,image/heif,image/*';
    input.multiple = true;
    input.setAttribute('aria-label', 'Choose ad photos');
    Object.assign(input.style, {
      position: 'fixed',
      left: '-9999px',
      top: '0',
      width: '1px',
      height: '1px',
      opacity: '0'
    });
    document.body.appendChild(input);

    input.addEventListener('change', async () => {
      const current = Array.isArray(existingImages) ? existingImages : [];
      const available = Math.max(0, MAX_IMAGES - current.length);
      const files = Array.from(input.files || []).slice(0, available);
      const next = [...current];

      try {
        if (!files.length) return;
        message('Optimizing selected photos...', 'pending');

        for (const file of files) {
          let image = await optimizedImage(file, 1600, 0.88);

          // Keep the complete request within Vercel's practical request limit.
          const estimatedTotal = next.reduce((sum, value) => sum + String(value).length, 0) + image.length;
          if (estimatedTotal > 3_500_000) {
            image = await optimizedImage(file, 1200, 0.82);
          }
          next.push(image);
        }

        runtime.images = next.slice(0, MAX_IMAGES);
        saveImages();
        setImages(runtime.images);
        message(`${runtime.images.length} photo${runtime.images.length === 1 ? '' : 's'} ready.`, 'success');
      } catch (error) {
        message(error.message || 'Image processing failed.');
      } finally {
        input.remove();
      }
    }, { once: true });

    input.click();
  };

  // -------------------------- Contact phones ------------------------------

  function newPhoneRow(value = '') {
    const id = Math.random().toString(36).slice(2, 10);
    return {
      id,
      purpose: `post_ad_contact_${id}`,
      value: String(value || ''),
      otpSent: false,
      verified: false,
      verifiedToken: '',
      status: 'Verify this number before continuing.',
      statusType: 'pending'
    };
  }

  function normalizePhone(value) {
    try { return otpClient().normalizePhone(value); }
    catch (_) {
      let raw = String(value || '').replace(/\D/g, '');
      if (raw.length === 10 && raw.startsWith('0')) raw = `94${raw.slice(1)}`;
      return raw;
    }
  }

  function displayPhone(value) {
    const normalized = normalizePhone(value);
    return /^947\d{8}$/.test(normalized) ? `0${normalized.slice(2)}` : String(value || '');
  }

  function ensureRows(initialValue = '') {
    if (!runtime.rows.length) runtime.rows = [newPhoneRow(initialValue)];
    if (runtime.rows.length > MAX_PHONES) runtime.rows = runtime.rows.slice(0, MAX_PHONES);
  }

  function setRowStatus(row, text, type = 'pending') {
    row.status = text;
    row.statusType = type;
    savePhoneState();
    renderPhonePanel();
  }

  function originalPhoneInput() {
    const container = heading('Contact & Location')?.parentElement;
    return labeledControl(container, 'Phone Number');
  }

  function syncPrimaryPhone() {
    const primary = runtime.rows[0]?.value || '';
    const input = originalPhoneInput();
    if (input && input.value !== displayPhone(primary)) {
      nativeSetInput(input, displayPhone(primary));
    }
  }

  function phonePanelHtml() {
    return `
      <div class="ehm-phone-heading">
        <div>
          <label>Contact Phone Number${runtime.rows.length === 1 ? '' : 's'} *</label>
          <p>Every number must be verified by SMS before the ad can be published.</p>
        </div>
        <span>${runtime.rows.filter((row) => row.verified).length}/${runtime.rows.length} verified</span>
      </div>
      <div class="ehm-phone-list">
        ${runtime.rows.map((row, index) => `
          <article class="ehm-phone-row ${row.verified ? 'verified' : ''} ${row.statusType === 'error' ? 'error' : ''}" data-phone-row="${esc(row.id)}">
            <div class="ehm-phone-main">
              <span class="ehm-phone-index">${index + 1}</span>
              <input class="input-field ehm-phone-input" type="tel" inputmode="tel"
                value="${esc(displayPhone(row.value))}" placeholder="0771234567"
                data-phone-input="${esc(row.id)}">
              <button type="button" class="ehm-phone-verify ${row.verified ? 'verified' : ''}"
                data-phone-verify="${esc(row.id)}">${row.verified ? '✓ Verified' : 'Verify'}</button>
              <button type="button" class="ehm-phone-remove" data-phone-remove="${esc(row.id)}"
                ${runtime.rows.length === 1 ? 'disabled' : ''}>×</button>
            </div>
            ${row.otpSent && !row.verified ? `
              <div class="ehm-phone-otp">
                <input class="input-field" inputmode="numeric" autocomplete="one-time-code"
                  maxlength="6" placeholder="6-digit OTP" data-phone-otp="${esc(row.id)}">
                <button type="button" data-phone-confirm="${esc(row.id)}">Confirm OTP</button>
                <button type="button" data-phone-resend="${esc(row.id)}">Resend</button>
              </div>
            ` : ''}
            <div class="ehm-phone-status ${esc(row.statusType)}">${esc(row.status || '')}</div>
          </article>
        `).join('')}
      </div>
      <button type="button" class="ehm-add-phone" id="ehm-add-phone"
        ${runtime.rows.length >= MAX_PHONES ? 'disabled' : ''}>+ Add another number</button>
    `;
  }

  function phonePanelSignature() {
    return JSON.stringify(runtime.rows.map((row) => ({
      id: row.id,
      otpSent: !!row.otpSent,
      verified: !!row.verified,
      status: String(row.status || ''),
      statusType: String(row.statusType || '')
    })));
  }

  function renderPhonePanel() {
    if (!isPostRoute()) return;
    if (document.querySelector('[data-ehm-native-phone-verification]')) return;
    const contactHeading = heading('Contact & Location');
    if (!contactHeading) return;

    const container = contactHeading.parentElement;
    const phoneInput = labeledControl(container, 'Phone Number');
    if (!phoneInput) return;

    const originalField = phoneInput.closest('div');
    if (!originalField) return;

    ensureRows(phoneInput.value);
    originalField.classList.add('ehm-original-phone-hidden');

    let panel = container.querySelector('#ehm-verified-phone-panel');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'ehm-verified-phone-panel';
      panel.className = 'ehm-verified-phone-panel';
      originalField.insertAdjacentElement('beforebegin', panel);

      panel.addEventListener('input', (event) => {
        const id = event.target?.dataset?.phoneInput;
        if (!id) return;
        const row = runtime.rows.find((item) => item.id === id);
        if (!row) return;

        row.value = event.target.value;
        row.verified = false;
        row.verifiedToken = '';
        row.otpSent = false;
        row.status = 'Verify this number before continuing.';
        row.statusType = 'pending';
        runtime.phoneProof = '';
        syncPrimaryPhone();
        savePhoneState();
      });

      panel.addEventListener('click', async (event) => {
        const button = event.target.closest('button');
        if (!button) return;
        event.preventDefault();
        event.stopPropagation();

        if (button.id === 'ehm-add-phone') {
          if (runtime.rows.length < MAX_PHONES) {
            runtime.rows.push(newPhoneRow());
            runtime.phoneProof = '';
            savePhoneState();
            renderPhonePanel();
            panel.querySelector(`[data-phone-input="${runtime.rows.at(-1).id}"]`)?.focus();
          }
          return;
        }

        const removeId = button.dataset.phoneRemove;
        if (removeId) {
          if (runtime.rows.length > 1) {
            runtime.rows = runtime.rows.filter((row) => row.id !== removeId);
            runtime.phoneProof = '';
            savePhoneState();
            syncPrimaryPhone();
            renderPhonePanel();
          }
          return;
        }

        const verifyId = button.dataset.phoneVerify;
        if (verifyId) {
          const row = runtime.rows.find((item) => item.id === verifyId);
          if (!row || row.verified) return;
          await requestPhoneOtp(row);
          return;
        }

        const confirmId = button.dataset.phoneConfirm;
        if (confirmId) {
          const row = runtime.rows.find((item) => item.id === confirmId);
          const otp = panel.querySelector(`[data-phone-otp="${confirmId}"]`)?.value || '';
          if (row) await confirmPhoneOtp(row, otp);
          return;
        }

        const resendId = button.dataset.phoneResend;
        if (resendId) {
          const row = runtime.rows.find((item) => item.id === resendId);
          if (row) await requestPhoneOtp(row, true);
        }
      });
    }

    const signature = phonePanelSignature();
    if (panel.dataset.signature !== signature) {
      panel.dataset.signature = signature;
      panel.innerHTML = phonePanelHtml();
    }
    syncPrimaryPhone();
  }

  async function requestPhoneOtp(row, resend = false) {
    const normalized = normalizePhone(row.value);
    if (!/^947\d{8}$/.test(normalized)) {
      return setRowStatus(row, 'Enter a valid Sri Lankan mobile number.', 'error');
    }

    const duplicates = runtime.rows.filter((item) => normalizePhone(item.value) === normalized);
    if (duplicates.length > 1) {
      return setRowStatus(row, 'The same phone number cannot be added twice.', 'error');
    }

    try {
      setRowStatus(row, 'Sending SMS OTP...', 'pending');
      const otp = otpClient();
      if (resend) otp.reset(row.purpose);
      const result = await otp.request(normalized, row.purpose);
      row.value = normalized;
      row.otpSent = true;
      row.verified = false;
      row.verifiedToken = '';
      row.status = result.message || 'OTP sent. Enter the 6-digit code.';
      row.statusType = 'pending';
      runtime.phoneProof = '';
      savePhoneState();
      renderPhonePanel();
      document.querySelector(`[data-phone-otp="${row.id}"]`)?.focus();
    } catch (error) {
      setRowStatus(row, error.message || 'Could not send the SMS OTP.', 'error');
    }
  }

  async function confirmPhoneOtp(row, code) {
    if (!/^\d{6}$/.test(String(code || '').trim())) {
      return setRowStatus(row, 'Enter the 6-digit OTP code.', 'error');
    }

    try {
      setRowStatus(row, 'Checking OTP...', 'pending');
      const result = await otpClient().verify(row.value, row.purpose, String(code).trim());
      row.value = normalizePhone(row.value);
      row.verified = true;
      row.verifiedToken = result.verifiedToken || otpClient().getVerifiedToken(row.purpose);
      row.otpSent = true;
      row.status = 'Phone number verified successfully.';
      row.statusType = 'success';
      runtime.phoneProof = '';
      savePhoneState();
      syncPrimaryPhone();
      renderPhonePanel();
    } catch (error) {
      setRowStatus(row, error.message || 'OTP verification failed.', 'error');
    }
  }

  function verifiedPhonePayload() {
    if (typeof window.ehmNativeVerifiedPhonePayload === 'function') {
      const nativeRows = window.ehmNativeVerifiedPhonePayload();
      if (!Array.isArray(nativeRows) || !nativeRows.length) throw new Error('Add at least one contact phone number.');
      const seen = new Set();
      return nativeRows.map((row) => {
        const phone = normalizePhone(row.phone);
        if (!/^947\d{8}$/.test(phone)) throw new Error('Enter a valid contact phone number.');
        if (seen.has(phone)) throw new Error('Duplicate contact phone numbers are not allowed.');
        if (!row.verifiedToken) throw new Error('Verify every contact phone number before continuing.');
        seen.add(phone);
        return { phone, purpose: row.purpose, verifiedToken: row.verifiedToken };
      });
    }
    ensureRows();
    const seen = new Set();
    const result = [];

    for (const row of runtime.rows) {
      const phone = normalizePhone(row.value);
      if (!/^947\d{8}$/.test(phone)) throw new Error('Enter a valid contact phone number.');
      if (seen.has(phone)) throw new Error('Duplicate contact phone numbers are not allowed.');
      if (!row.verified || !row.verifiedToken) {
        throw new Error('Verify every contact phone number before continuing.');
      }
      seen.add(phone);
      result.push({
        phone,
        purpose: row.purpose,
        verifiedToken: row.verifiedToken
      });
    }

    if (!result.length) throw new Error('Add at least one contact phone number.');
    return result;
  }

  async function validatePhoneProof() {
    const phones = verifiedPhonePayload();
    const response = await fetch('/api/validate-ad-phones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ phones })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      throw new Error(data.message || 'Phone verification validation failed.');
    }
    runtime.phoneProof = data.proof;
    savePhoneState();
    return data;
  }

  // -------------------------- City selection ------------------------------

  function ensureCity() {
    if (!isPostRoute()) return;
    if (document.querySelector('[data-ehm-native-city]')) return;
    const contactHeading = heading('Contact & Location');
    if (!contactHeading) return;
    const container = contactHeading.parentElement;
    const district = labeledControl(container, 'District', 'select');
    if (!district) return;

    // post-ad-category-fields.js normally creates this. This fallback ensures
    // it still appears even if React re-renders the Contact step.
    let city = document.getElementById('ehm-city-select');
    if (!city) {
      const districtField = district.closest('div');
      const field = document.createElement('div');
      field.id = 'ehm-city-field';
      field.innerHTML = `
        <label class="block text-sm font-medium text-surface-700 mb-2">City / Town *</label>
        <select id="ehm-city-select" class="input-field" required>
          <option value="">Select district first</option>
        </select>
        <div id="ehm-location-error" class="ehm-inline-error"></div>
      `;
      districtField?.insertAdjacentElement('afterend', field);
      city = field.querySelector('select');
    }

    const map = window.EHM_POST_AD_FORM?.DISTRICT_CITIES || {};
    const populate = () => {
      const selectedDistrict = district.value;
      const previous = city.value;
      const values = selectedDistrict
        ? [...(map[selectedDistrict] || []), 'Other / Not listed']
        : [];
      city.disabled = !selectedDistrict;
      city.innerHTML = [
        `<option value="">${selectedDistrict ? 'Select city / town' : 'Select district first'}</option>`,
        ...values.map((name) => `<option value="${esc(name)}">${esc(name)}</option>`)
      ].join('');
      if (values.includes(previous)) city.value = previous;
    };

    if (!district.dataset.ehmRuntimeCityBound) {
      district.dataset.ehmRuntimeCityBound = '1';
      district.addEventListener('change', () => {
        populate();
        runtime.phoneProof = runtime.phoneProof;
      });
    }

    if (city.dataset.district !== district.value) {
      city.dataset.district = district.value;
      populate();
    }
  }

  function saveNativeLocationFromContactStep() {
    const district = document.querySelector('[data-ehm-native-district]');
    const city = document.querySelector('[data-ehm-native-city] select') ||
      document.getElementById('ehm-city-select');

    if (!district || !city) return null;

    const payload = {
      district: String(district.value || ''),
      city: String(city.value || '')
    };

    try {
      sessionStorage.setItem(
        'ehemehe:nativePostLocation:v2',
        JSON.stringify(payload)
      );
    } catch (_) {}

    return payload;
  }

  function storedNativeLocation() {
    const live = saveNativeLocationFromContactStep();
    if (live?.district || live?.city) return live;

    try {
      const saved = JSON.parse(
        sessionStorage.getItem('ehemehe:nativePostLocation:v2') || 'null'
      );
      if (saved && typeof saved === 'object') {
        return {
          district: String(saved.district || ''),
          city: String(saved.city || '')
        };
      }
    } catch (_) {}

    return { district: '', city: '' };
  }

  function validateLocation() {
    const native = storedNativeLocation();

    if (!native.district) throw new Error('Select a district.');
    if (!native.city) throw new Error('Select a city or town.');

    return native;
  }

  // -------------------------- Collect and publish -------------------------

  function readPostDraft() {
    const value = readJsonStorage(sessionStorage, POST_DRAFT_KEY, {});
    return value && typeof value === 'object' ? value : {};
  }

  function savePostDraft(patch) {
    try {
      const current = readPostDraft();
      sessionStorage.setItem(POST_DRAFT_KEY, JSON.stringify({
        ...current,
        ...patch,
        updatedAt: Date.now()
      }));
    } catch (_) {}
  }

  function liveCategorySelection() {
    const container = heading('Select Category')?.parentElement;
    const category = labeledControl(container, 'Category', 'select');
    const subcategory = labeledControl(container, 'Subcategory', 'select');
    if (!category && !subcategory) return null;

    return {
      categoryId: category?.value || '',
      categoryName: clean(category?.selectedOptions?.[0]?.textContent || ''),
      subcategoryId: subcategory?.value || '',
      subcategoryName: clean(subcategory?.selectedOptions?.[0]?.textContent || '')
    };
  }

  function captureCategorySelection() {
    const live = liveCategorySelection();
    if (!live || (!live.categoryId && !live.subcategoryId)) return null;
    savePostDraft({ category: live });
    return live;
  }

  function storedCategorySelection() {
    const draft = readPostDraft();
    if (draft.category && typeof draft.category === 'object') {
      const category = {
        categoryId: String(draft.category.categoryId || ''),
        categoryName: String(draft.category.categoryName || ''),
        subcategoryId: String(draft.category.subcategoryId || ''),
        subcategoryName: String(draft.category.subcategoryName || '')
      };
      if (category.categoryId || category.subcategoryId) return category;
    }

    // Fallback for drafts created before the runtime snapshot was introduced.
    for (const storage of [sessionStorage, localStorage]) {
      try {
        const selection = JSON.parse(storage.getItem(CATEGORY_SELECTION_KEY) || 'null');
        if (selection && typeof selection === 'object') {
          const categoryId = slug(selection.category);
          const subcategoryId = slug(selection.subcategory);
          if (categoryId || subcategoryId) {
            return {
              categoryId,
              categoryName: String(selection.category || '').replace(/-/g, ' '),
              subcategoryId,
              subcategoryName: String(selection.subcategory || '').replace(/-/g, ' ')
            };
          }
        }
      } catch (_) {}
    }

    try {
      const form = JSON.parse(localStorage.getItem(CATEGORY_FORM_KEY) || 'null');
      if (form && typeof form === 'object') {
        const categoryId = slug(form.category);
        const subcategoryId = slug(form.subcategory);
        if (categoryId || subcategoryId) {
          return {
            categoryId,
            categoryName: String(form.category || '').replace(/-/g, ' '),
            subcategoryId,
            subcategoryName: String(form.subcategory || '').replace(/-/g, ' ')
          };
        }
      }
    } catch (_) {}

    return { categoryId: '', categoryName: '', subcategoryId: '', subcategoryName: '' };
  }

  function selectedCategory() {
    return captureCategorySelection() || storedCategorySelection();
  }

  const PRICE_LABELS = [
    'Price (LKR)',
    'Price / Rent (LKR)',
    'Monthly Rent (LKR)',
    'Salary / Pay (LKR)',
    'Service Price / Starting Price (LKR)',
    'Course / Class Fee (LKR)'
  ];

  function detailPriceControl(container) {
    for (const label of PRICE_LABELS) {
      const control = labeledControl(container, label);
      if (control) return control;
    }
    return null;
  }

  function captureBaseDetails() {
    const container = heading('Ad Details')?.parentElement;
    if (!container) return null;

    const details = {
      title: labeledControl(container, 'Title')?.value || '',
      description: labeledControl(container, 'Description')?.value || '',
      price: detailPriceControl(container)?.value || '',
      condition: labeledControl(container, 'Condition', 'select')?.value || ''
    };
    savePostDraft({ details });
    return details;
  }

  function reviewValue(container, labelText) {
    if (!container) return '';
    const wanted = labelKey(labelText);

    for (const label of container.querySelectorAll('div,span')) {
      if (labelKey(label.textContent) !== wanted) continue;
      if (label.children.length) continue;

      const card = label.parentElement;
      if (!card) continue;
      const value = Array.from(card.children)
        .find((child) => child !== label && labelKey(child.textContent) !== wanted);
      if (value) return clean(value.textContent);
    }
    return '';
  }

  function detailsFromReview() {
    const container = heading('Review Your Ad')?.parentElement;
    const rawPrice = reviewValue(container, 'Price');
    return {
      title: reviewValue(container, 'Title'),
      description: reviewValue(container, 'Description'),
      price: rawPrice.replace(/[^\d.]/g, ''),
      condition: reviewValue(container, 'Condition').toLowerCase()
    };
  }

  function collectDetails() {
    const live = captureBaseDetails();
    if (live) return live;

    const draft = readPostDraft();
    const stored = draft.details && typeof draft.details === 'object'
      ? {
          title: String(draft.details.title || ''),
          description: String(draft.details.description || ''),
          price: String(draft.details.price || ''),
          condition: String(draft.details.condition || '')
        }
      : { title: '', description: '', price: '', condition: '' };

    const review = detailsFromReview();
    return {
      title: stored.title || review.title,
      description: stored.description || review.description,
      price: stored.price || review.price,
      condition: stored.condition || review.condition
    };
  }

  function collectCustomFields() {
    const output = {};
    document.querySelectorAll('[data-ehm-field]').forEach((control) => {
      const value = clean(control.value);
      if (value) output[control.dataset.ehmField] = value;
    });

    try {
      const stored = JSON.parse(localStorage.getItem('ehemehe:postAdForm:v4') || 'null');
      const key = `${slug(stored?.category)}:${slug(stored?.subcategory)}`;
      Object.assign(output, stored?.fieldsByKey?.[key] || {});
    } catch (_) {}

    return output;
  }

  function captureContactDetails() {
    const container = heading('Contact & Location')?.parentElement;
    if (!container) return null;
    const contact = {
      email: labeledControl(container, 'Email')?.value || ''
    };
    savePostDraft({ contact });
    return contact;
  }

  function collectContact() {
    const live = captureContactDetails();
    const draft = readPostDraft();
    return {
      email: String(live?.email || draft.contact?.email || ''),
      ...validateLocation()
    };
  }

  function localAds() {
    const rows = readJsonStorage(localStorage, LOCAL_ADS_KEY, []);
    return Array.isArray(rows) ? rows : [];
  }

  function saveLocalAd(ad) {
    try {
      const rows = localAds().filter((row) => String(row.localId) !== String(ad.localId));
      rows.unshift(ad);
      localStorage.setItem(LOCAL_ADS_KEY, JSON.stringify(rows.slice(0, 100)));
    } catch (_) {}
  }

  function updateLocalAd(id, patch) {
    try {
      const rows = localAds();
      let changed = false;
      const next = rows.map((row) => {
        const matches = [row.id, row.localId].some((value) => String(value || '') === String(id || ''));
        if (!matches) return row;
        changed = true;
        return { ...row, ...patch };
      });
      if (changed) localStorage.setItem(LOCAL_ADS_KEY, JSON.stringify(next.slice(0, 100)));
    } catch (_) {}
  }

  async function session() {
    const client = window.supabaseClient || await window.waitForSupabaseClient?.().catch(() => null);
    if (!client?.auth) return null;
    const result = await client.auth.getSession();
    return result.data?.session || null;
  }

  function setPostAuthLoading(loading) {
    const root = document.getElementById('root');
    if (!root) return;
    root.style.visibility = loading ? 'hidden' : '';
  }

  async function ensurePostAuthentication() {
    if (!isPostRoute()) return true;
    if (runtime.authAllowed) return true;
    if (runtime.authRedirected || runtime.authChecking) return false;

    runtime.authChecking = true;
    setPostAuthLoading(true);

    try {
      const authSession = await session();

      if (authSession?.user) {
        runtime.authAllowed = true;
        setPostAuthLoading(false);
        return true;
      }

      runtime.authRedirected = true;
      const returnTo = `${location.pathname}${location.search}${location.hash}`;
      location.replace(`/signup?returnTo=${encodeURIComponent(returnTo)}`);
      return false;
    } catch (_) {
      runtime.authRedirected = true;
      const returnTo = `${location.pathname}${location.search}${location.hash}`;
      location.replace(`/signup?returnTo=${encodeURIComponent(returnTo)}`);
      return false;
    } finally {
      runtime.authChecking = false;
    }
  }

  async function publishAd(button) {
    if (runtime.publishing) return;
    runtime.publishing = true;
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = 'Publishing...';

    try {
      const authSession = await session();
      if (!authSession?.user || !authSession.access_token) {
        throw new Error('Log in before publishing an ad.');
      }

      const category = selectedCategory();
      const details = collectDetails();
      const contact = collectContact();
      const phoneValidation = await validatePhoneProof();
      const phones = verifiedPhonePayload().map((row) => row.phone);

      if (!details.title.trim() || !details.description.trim() || !details.price) {
        throw new Error('Complete the title, description and price.');
      }

      const payload = {
        ...category,
        ...details,
        ...contact,
        images: runtime.images,
        phones,
        phoneProof: phoneValidation.proof,
        customFields: collectCustomFields()
      };

      const response = await fetch('/api/publish-ad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) {
        throw new Error(data.message || `Could not publish the ad (HTTP ${response.status}).`);
      }

      const localAd = {
        localId: data.ad?.id || `local-${Date.now()}`,
        id: data.ad?.id || '',
        userId: authSession.user.id,
        title: details.title,
        description: details.description,
        price: details.price,
        status: data.ad?.status || 'pending',
        categoryId: category.categoryId,
        categoryName: category.categoryName,
        subcategoryId: category.subcategoryId,
        subcategoryName: category.subcategoryName,
        district: contact.district,
        city: contact.city,
        phones,
        images: runtime.images,
        image_url: runtime.images[0] || '',
        created_at: data.ad?.created_at || new Date().toISOString(),
        server: true
      };
      saveLocalAd(localAd);

      sessionStorage.removeItem(PHONE_STATE_KEY);
      sessionStorage.removeItem(IMAGE_STATE_KEY);
      sessionStorage.removeItem(POST_DRAFT_KEY);
      runtime.rows = [];
      runtime.images = [];
      runtime.phoneProof = '';

      message('Ad submitted successfully. It is now visible in My Ads.', 'success');

      button.dataset.ehmAllowOriginal = '1';
      button.disabled = false;
      button.textContent = originalText;
      button.click();
    } catch (error) {
      message(error.message || 'Could not publish the ad.');
      if (/log in/i.test(error.message || '')) {
        setTimeout(() => {
          location.href = `/login?returnTo=${encodeURIComponent('/post')}`;
        }, 900);
      }
    } finally {
      runtime.publishing = false;
      if (button.isConnected) {
        button.disabled = false;
        button.textContent = originalText;
      }
    }
  }

  async function continueFromContact(button) {
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = 'Checking...';

    try {
      captureContactDetails();
      validateLocation();
      await validatePhoneProof();
      message('', 'success');

      button.dataset.ehmAllowOriginal = '1';
      button.disabled = false;
      button.textContent = originalText;
      button.click();
    } catch (error) {
      message(error.message || 'Complete contact verification.');
    } finally {
      if (button.isConnected) {
        button.disabled = false;
        button.textContent = originalText;
      }
    }
  }

  function interceptNavigation(event) {
    if (!isPostRoute()) return;
    const button = event.target?.closest?.('button');
    if (!button) return;

    if (button.dataset.ehmAllowOriginal === '1') {
      delete button.dataset.ehmAllowOriginal;
      return;
    }

    const text = labelKey(button.textContent);

    if (heading('Select Category')) captureCategorySelection();
    if (heading('Ad Details')) captureBaseDetails();
    if (heading('Contact & Location')) captureContactDetails();

    if (text === 'continue' && heading('Contact & Location')) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      continueFromContact(button);
      return;
    }

    if (text === 'post ad' && heading('Review Your Ad')) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      publishAd(button);
    }
  }

  // -------------------------- Dashboard -----------------------------------

  function statusBadge(status) {
    const value = String(status || 'pending').toLowerCase();
    return `<span class="ehm-dashboard-status ${esc(value)}">${esc(value)}</span>`;
  }

  function dashboardNotice(text, type = 'success') {
    let node = document.getElementById('ehm-dashboard-notice');
    if (!node) {
      node = document.createElement('div');
      node.id = 'ehm-dashboard-notice';
      node.className = 'ehm-dashboard-notice';
      const heading = Array.from(document.querySelectorAll('h1,h2'))
        .find((item) => labelKey(item.textContent) === 'my ads');
      const section = heading?.parentElement?.parentElement || heading?.parentElement;
      section?.prepend(node);
    }
    if (!node) return;
    node.className = `ehm-dashboard-notice ${type}`;
    node.textContent = text;
    node.hidden = !text;
    window.clearTimeout(dashboardNotice.timer);
    if (text) dashboardNotice.timer = window.setTimeout(() => { if (node.isConnected) node.hidden = true; }, 6500);
  }

  function dashboardLocationMap() {
    const source = window.EHM_POST_AD_FORM?.DISTRICT_CITIES;
    return source && typeof source === 'object' ? source : {};
  }

  function option(value, selected, label = value) {
    return `<option value="${esc(value)}" ${String(value) === String(selected) ? 'selected' : ''}>${esc(label)}</option>`;
  }

  function conditionOptions(current) {
    const known = [
      ['', 'Not specified'],
      ['new', 'New'],
      ['used', 'Used'],
      ['reconditioned', 'Reconditioned']
    ];
    const normalized = String(current || '').toLowerCase();
    if (normalized && !known.some(([value]) => value === normalized)) known.push([normalized, current]);
    return known.map(([value, label]) => option(value, normalized, label)).join('');
  }

  function districtOptions(current) {
    const map = dashboardLocationMap();
    const names = Object.keys(map);
    if (current && !names.includes(current)) names.unshift(current);
    return names.map((name) => option(name, current)).join('');
  }

  function cityOptions(district, current) {
    const map = dashboardLocationMap();
    const names = Array.isArray(map[district]) ? [...map[district]] : [];
    if (current && !names.includes(current)) names.unshift(current);
    return names.map((name) => option(name, current)).join('');
  }

  function closeEditModal() {
    document.getElementById('ehm-edit-ad-modal')?.remove();
    document.body.classList.remove('ehm-modal-open');
  }

  function setEditPreview(source) {
    const preview = document.querySelector('#ehm-edit-ad-modal .ehm-edit-preview');
    if (!preview) return;
    preview.innerHTML = source
      ? `<img src="${esc(source)}" alt="Ad photo preview">`
      : '<span>No photo</span>';
  }

  function fileToOptimizedImage(file) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\/(jpeg|jpg|png|webp)$/i.test(file.type || '')) {
        reject(new Error('Choose a JPG, PNG or WebP image.'));
        return;
      }
      if (file.size > 12 * 1024 * 1024) {
        reject(new Error('The selected photo is too large. Choose an image under 12 MB.'));
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read the selected photo.'));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('The selected photo could not be opened.'));
        image.onload = () => {
          const maxSide = 1600;
          const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const context = canvas.getContext('2d');
          if (!context) {
            reject(new Error('Photo processing is unavailable in this browser.'));
            return;
          }
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        image.src = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    });
  }

  function openEditModal(adId) {
    const ad = runtime.dashboardAds.find((row) => String(row.id || row.localId || '') === String(adId || ''));
    if (!ad?.id) {
      dashboardNotice('This ad is still syncing. Reload the page and try again.', 'error');
      return;
    }

    closeEditModal();
    const custom = ad.custom_fields || {};
    const district = ad.district || custom.district || '';
    const city = ad.city || custom.city || '';
    const image = ad.image_url || ad.images?.[0] || '';
    const modal = document.createElement('div');
    modal.id = 'ehm-edit-ad-modal';
    modal.className = 'ehm-edit-ad-modal';
    modal.innerHTML = `
      <div class="ehm-edit-ad-dialog" role="dialog" aria-modal="true" aria-labelledby="ehm-edit-ad-title">
        <div class="ehm-edit-ad-head">
          <div>
            <h2 id="ehm-edit-ad-title">Edit Ad</h2>
            <p>After saving, this ad will move to Pending and remain hidden until an admin approves it again.</p>
          </div>
          <button type="button" class="ehm-edit-close" data-ehm-edit-close aria-label="Close">×</button>
        </div>
        <form id="ehm-edit-ad-form">
          <input type="hidden" name="id" value="${esc(ad.id)}">
          <div class="ehm-edit-grid">
            <label class="ehm-edit-wide">Ad title
              <input name="title" maxlength="160" required value="${esc(ad.title || '')}">
            </label>
            <label>Price (LKR)
              <input name="price" type="number" min="0" step="1" required value="${esc(ad.price ?? '')}">
            </label>
            <label>Condition
              <select name="condition">${conditionOptions(ad.condition || custom.condition || '')}</select>
            </label>
            <label>District
              <select name="district" required>${districtOptions(district)}</select>
            </label>
            <label>City / Town
              <select name="city" required>${cityOptions(district, city)}</select>
            </label>
            <label class="ehm-edit-wide">Description
              <textarea name="description" rows="6" maxlength="10000" required>${esc(ad.description || '')}</textarea>
            </label>
            <div class="ehm-edit-wide ehm-edit-photo-row">
              <div class="ehm-edit-preview">${image ? `<img src="${esc(image)}" alt="Current ad photo">` : '<span>No photo</span>'}</div>
              <label>Change main photo <small>Optional. Existing photo stays unless you choose a new one.</small>
                <input name="photo" type="file" accept="image/jpeg,image/png,image/webp">
              </label>
            </div>
          </div>
          <div class="ehm-edit-review-warning">Saving always changes the ad status to Pending. It will be published only after admin approval.</div>
          <div class="ehm-edit-error" aria-live="polite"></div>
          <div class="ehm-edit-actions">
            <button type="button" class="ehm-edit-cancel" data-ehm-edit-close>Cancel</button>
            <button type="submit" class="ehm-edit-save">Save & Send for Review</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(modal);
    document.body.classList.add('ehm-modal-open');

    const districtField = modal.querySelector('[name="district"]');
    const cityField = modal.querySelector('[name="city"]');
    districtField?.addEventListener('change', () => {
      cityField.innerHTML = cityOptions(districtField.value, '');
    });
    modal.querySelector('[name="photo"]')?.addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) {
        setEditPreview(image);
        return;
      }
      const errorNode = modal.querySelector('.ehm-edit-error');
      try {
        errorNode.textContent = 'Preparing photo...';
        errorNode.className = 'ehm-edit-error pending';
        const optimized = await fileToOptimizedImage(file);
        event.target.dataset.optimizedImage = optimized;
        setEditPreview(optimized);
        errorNode.textContent = '';
        errorNode.className = 'ehm-edit-error';
      } catch (error) {
        event.target.value = '';
        delete event.target.dataset.optimizedImage;
        errorNode.textContent = error.message || 'Could not prepare the photo.';
        errorNode.className = 'ehm-edit-error error';
      }
    });
    modal.querySelector('[name="title"]')?.focus();
  }

  async function submitEditForm(form) {
    const errorNode = form.querySelector('.ehm-edit-error');
    const saveButton = form.querySelector('.ehm-edit-save');
    const data = new FormData(form);
    const authSession = await session();
    if (!authSession?.access_token) throw new Error('Log in to edit your ad.');

    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
    errorNode.textContent = '';
    errorNode.className = 'ehm-edit-error';

    try {
      const photo = form.querySelector('[name="photo"]');
      const payload = {
        id: String(data.get('id') || ''),
        title: String(data.get('title') || ''),
        price: String(data.get('price') || ''),
        condition: String(data.get('condition') || ''),
        district: String(data.get('district') || ''),
        city: String(data.get('city') || ''),
        description: String(data.get('description') || '')
      };
      if (photo?.dataset.optimizedImage) payload.image = photo.dataset.optimizedImage;

      const response = await fetch('/api/update-my-ad', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok === false) {
        throw new Error(result.message || `Could not update the ad (HTTP ${response.status}).`);
      }

      const updated = normalizeDashboardAd(result.ad || { ...payload, status: 'pending' });
      updateLocalAd(payload.id, {
        ...updated,
        title: payload.title,
        description: payload.description,
        price: payload.price,
        condition: payload.condition,
        district: payload.district,
        city: payload.city,
        status: 'pending',
        image_url: payload.image || updated.image_url,
        images: payload.image ? [payload.image, ...(updated.images || []).slice(1)] : updated.images,
        updated_at: result.ad?.updated_at || new Date().toISOString()
      });

      runtime.dashboardLoadedAt = 0;
      closeEditModal();
      await loadDashboardAds(true);
      await renderDashboard();
      dashboardNotice(result.message || 'Changes saved. The ad is pending admin approval.', 'success');
    } catch (error) {
      errorNode.textContent = error.message || 'Could not update the ad.';
      errorNode.className = 'ehm-edit-error error';
      throw error;
    } finally {
      if (saveButton.isConnected) {
        saveButton.disabled = false;
        saveButton.textContent = 'Save & Send for Review';
      }
    }
  }

  function adCard(ad) {
    const image = ad.image_url || ad.images?.[0] || '';
    const locationText = [ad.city || ad.custom_fields?.city, ad.district || ad.custom_fields?.district]
      .filter(Boolean).join(', ');
    const price = Number(String(ad.price || '').replace(/[^\d.]/g, ''));
    const id = ad.id || ad.localId || '';
    const canEdit = Boolean(ad.id);
    return `
      <article class="ehm-dashboard-ad-card">
        <div class="ehm-dashboard-ad-image">
          ${image ? `<img src="${esc(image)}" alt="">` : '<span>No photo</span>'}
        </div>
        <div class="ehm-dashboard-ad-content">
          <div class="ehm-dashboard-ad-top">
            <h3>${esc(ad.title || 'Untitled Ad')}</h3>
            ${statusBadge(ad.status)}
          </div>
          <strong>${Number.isFinite(price) ? `LKR ${Math.round(price).toLocaleString('en-LK')}` : 'Price on request'}</strong>
          <p>${esc(locationText || ad.location || '')}</p>
          <div class="ehm-dashboard-ad-footer">
            <small>Submitted ${new Date(ad.created_at || Date.now()).toLocaleDateString('en-LK')}</small>
            <button type="button" class="ehm-dashboard-edit" data-ehm-edit-ad="${esc(id)}" ${canEdit ? '' : 'disabled'}>Edit Ad</button>
          </div>
        </div>
      </article>
    `;
  }

  function normalizeDashboardAd(row) {
    let custom = row.custom_fields || {};
    if (typeof custom === 'string') {
      try { custom = JSON.parse(custom); } catch (_) { custom = {}; }
    }
    let images = row.images || [];
    if (typeof images === 'string') {
      try { images = JSON.parse(images); } catch (_) { images = []; }
    }
    if (!Array.isArray(images)) images = [];

    return {
      ...row,
      custom_fields: custom,
      images,
      image_url: row.image_url || images[0] || '',
      city: row.city || custom.city || '',
      district: row.district || custom.district || ''
    };
  }

  async function loadDashboardAds(force = false) {
    if (runtime.dashboardLoading) return runtime.dashboardAds;
    if (!force && Date.now() - runtime.dashboardLoadedAt < 5000) return runtime.dashboardAds;

    runtime.dashboardLoading = true;
    try {
      const authSession = await session();
      if (!authSession?.user || !authSession.access_token) return [];

      let remote = [];
      try {
        const response = await fetch('/api/my-ads', {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${authSession.access_token}`
          }
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok && data.ok !== false && Array.isArray(data.ads)) remote = data.ads;
      } catch (_) {}

      const local = localAds().filter((ad) => String(ad.userId) === String(authSession.user.id));
      const byId = new Map();
      [...local, ...remote].forEach((ad) => {
        const normalized = normalizeDashboardAd(ad);
        const key = String(normalized.id || normalized.localId || `${normalized.title}|${normalized.created_at}`);
        byId.set(key, { ...(byId.get(key) || {}), ...normalized });
      });

      runtime.dashboardAds = Array.from(byId.values())
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      runtime.dashboardLoadedAt = Date.now();
      return runtime.dashboardAds;
    } finally {
      runtime.dashboardLoading = false;
    }
  }

  function updateDashboardCount(count) {
    Array.from(document.querySelectorAll('div')).forEach((node) => {
      if (clean(node.textContent) !== 'My Ads') return;
      const card = node.closest('.bg-white');
      const number = card?.querySelector('.font-bold');
      if (number && /^\d+$/.test(clean(number.textContent)) && clean(number.textContent) !== String(count)) {
        number.textContent = String(count);
      }
    });
  }

  async function renderDashboard() {
    if (!route().startsWith('/dashboard')) return;
    const ads = await loadDashboardAds();
    updateDashboardCount(ads.length);

    const myAdsHeading = Array.from(document.querySelectorAll('h1,h2'))
      .find((node) => labelKey(node.textContent) === 'my ads');
    if (!myAdsHeading) return;

    const section = myAdsHeading.parentElement?.parentElement || myAdsHeading.parentElement;
    if (!section) return;

    const oldList = Array.from(section.children)
      .find((child) => child.classList?.contains('space-y-4'));
    if (oldList) oldList.style.display = 'none';

    let panel = section.querySelector('#ehm-real-my-ads');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'ehm-real-my-ads';
      panel.className = 'ehm-real-my-ads';
      section.appendChild(panel);
    }

    const signature = JSON.stringify(ads.map((ad) => [ad.id, ad.localId, ad.status, ad.updated_at, ad.created_at]));
    if (panel.dataset.signature === signature) return;
    panel.dataset.signature = signature;
    panel.innerHTML = ads.length
      ? ads.map(adCard).join('')
      : `<div class="ehm-dashboard-empty">
          <strong>No ads submitted yet</strong>
          <span>Your published ads will appear here.</span>
        </div>`;
  }

  // -------------------------- Lifecycle -----------------------------------

  async function tick() {
    if (runtime.tickRunning) {
      runtime.tickQueued = true;
      return;
    }

    runtime.tickRunning = true;
    try {
      if (isPostRoute()) {
        const authenticated = await ensurePostAuthentication();
        if (!authenticated) return;

        captureCategorySelection();
        captureBaseDetails();
        captureContactDetails();
        ensureCity();
        renderPhonePanel();
        saveNativeLocationFromContactStep();
      }

      if (route().startsWith('/dashboard')) await renderDashboard();
    } finally {
      runtime.tickRunning = false;
      if (runtime.tickQueued) {
        runtime.tickQueued = false;
        scheduleRuntimeTick(0);
      }
    }
  }

  if (window.__EHM_ENABLE_TEST_HOOKS__) {
    window.__EHM_POST_RUNTIME_TEST__ = {
      captureCategorySelection,
      selectedCategory,
      captureBaseDetails,
      collectDetails,
      captureContactDetails,
      collectContact,
      detailsFromReview,
      readPostDraft
    };
  }

  restoreRuntimeState();
  installRouteChangeEvents();

  function capturePostFormInput(event) {
    if (!isPostRoute()) return;

    if (event.target?.closest?.('[data-ehm-post-step="category"]')) {
      captureCategorySelection();
    }
    if (event.target?.closest?.('[data-ehm-post-step="details"]')) {
      captureBaseDetails();
    }
    const contactContainer = heading('Contact & Location')?.parentElement;
    if (contactContainer?.contains(event.target)) captureContactDetails();
  }

  document.addEventListener('input', capturePostFormInput, true);
  document.addEventListener('change', (event) => {
    capturePostFormInput(event);
    if (!isPostRoute()) return;
    if (
      event.target?.matches?.('[data-ehm-native-district]') ||
      event.target?.matches?.('[data-ehm-native-city] select') ||
      event.target?.id === 'ehm-city-select'
    ) {
      saveNativeLocationFromContactStep();
    }
  }, true);

  document.addEventListener('click', interceptNavigation, true);

  document.addEventListener('click', (event) => {
    const editButton = event.target?.closest?.('[data-ehm-edit-ad]');
    if (editButton) {
      event.preventDefault();
      openEditModal(editButton.dataset.ehmEditAd);
      return;
    }
    if (event.target?.closest?.('[data-ehm-edit-close]')) {
      event.preventDefault();
      closeEditModal();
      return;
    }
    if (event.target?.id === 'ehm-edit-ad-modal') closeEditModal();
  });

  document.addEventListener('submit', (event) => {
    const form = event.target?.closest?.('#ehm-edit-ad-form');
    if (!form) return;
    event.preventDefault();
    submitEditForm(form).catch(() => {});
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.getElementById('ehm-edit-ad-modal')) closeEditModal();
  });

  let runtimeTimer = 0;
  function scheduleRuntimeTick(delay = 40) {
    window.clearTimeout(runtimeTimer);
    runtimeTimer = window.setTimeout(tick, delay);
  }

  const observer = new MutationObserver(() => scheduleRuntimeTick(40));
  let observingRuntimeRoute = false;

  function updateRuntimeLifecycle() {
    if (isRuntimeRoute()) {
      if (!observingRuntimeRoute) {
        observer.observe(document.documentElement, { childList: true, subtree: true });
        observingRuntimeRoute = true;
      }
      scheduleRuntimeTick(0);
      return;
    }

    if (observingRuntimeRoute) {
      observer.disconnect();
      observingRuntimeRoute = false;
    }
    window.clearTimeout(runtimeTimer);
  }

  document.addEventListener('DOMContentLoaded', updateRuntimeLifecycle);
  window.addEventListener('ehemehe:routechange', updateRuntimeLifecycle);
  updateRuntimeLifecycle();
})();
