(() => {
  const DASHBOARD_PROFILE_HEAD = '[data-yw="c3JjL3BhZ2VzL0Rhc2hib2FyZFBhZ2UudHN4QDQzOjE0"]';
  const DASHBOARD_AVATAR = '[data-yw="c3JjL3BhZ2VzL0Rhc2hib2FyZFBhZ2UudHN4QDQ0OjE2"]';
  const HEADER_AVATAR = '[data-yw="c3JjL2NvbXBvbmVudHMvSGVhZGVyLnRzeEAxMTk6MTg"]';
  const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
  const MAX_AVATAR_DATA_LENGTH = 70000;

  let currentUser = null;
  let currentAvatarUrl = '';
  let observer = null;
  let refreshQueued = false;

  function isDashboardRoute() {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    return path === '/dashboard' || path.startsWith('/dashboard/');
  }

  function queueRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(() => {
      refreshQueued = false;
      decorateDashboardProfile();
      applyAvatarToHeader();
    });
  }

  function setStatus(message, type = '') {
    const status = document.querySelector('.ehm-profile-photo-status');
    if (!status) return;
    status.textContent = message || '';
    status.dataset.type = type;
  }

  function setBusy(isBusy) {
    const button = document.querySelector('.ehm-profile-photo-change');
    const input = document.querySelector('.ehm-profile-photo-input');
    if (button) {
      button.disabled = isBusy;
      button.textContent = isBusy ? 'Saving...' : (currentAvatarUrl ? 'Change photo' : 'Add photo');
    }
    if (input) input.disabled = isBusy;
  }

  function avatarImage(url, className) {
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Profile picture';
    img.className = className;
    img.decoding = 'async';
    return img;
  }

  function paintAvatar(container, url, imageClass) {
    if (!container) return;
    let image = container.querySelector(`.${imageClass}`);
    if (!url) {
      image?.remove();
      container.classList.remove('ehm-has-profile-photo');
      return;
    }
    if (!image) {
      image = avatarImage(url, imageClass);
      container.appendChild(image);
    } else if (image.src !== url) {
      image.src = url;
    }
    container.classList.add('ehm-has-profile-photo');
  }

  function applyAvatarToHeader() {
    // Keep the desktop Account control as a normal button. The uploaded
    // profile photo belongs only in the dashboard profile card; placing it
    // inside the compact header avatar stretches the Account button.
    document.querySelectorAll(HEADER_AVATAR).forEach((node) => {
      node.querySelectorAll('.ehm-header-profile-image').forEach((image) => image.remove());
      node.classList.remove('ehm-has-profile-photo');
    });
  }

  function decorateDashboardProfile() {
    if (!isDashboardRoute()) return;

    const profileHead = document.querySelector(DASHBOARD_PROFILE_HEAD);
    const avatar = document.querySelector(DASHBOARD_AVATAR);
    if (!profileHead || !avatar) return;

    avatar.classList.add('ehm-dashboard-profile-avatar');
    paintAvatar(avatar, currentAvatarUrl, 'ehm-dashboard-profile-image');

    if (!avatar.querySelector('.ehm-profile-photo-camera')) {
      const camera = document.createElement('span');
      camera.className = 'ehm-profile-photo-camera';
      camera.setAttribute('aria-hidden', 'true');
      camera.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8.5 7 10 5h4l1.5 2H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
      avatar.appendChild(camera);
    }

    let actions = profileHead.querySelector('.ehm-profile-photo-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'ehm-profile-photo-actions';
      actions.innerHTML = `
        <button type="button" class="ehm-profile-photo-change">${currentAvatarUrl ? 'Change photo' : 'Add photo'}</button>
        <span class="ehm-profile-photo-status" aria-live="polite"></span>
        <input class="ehm-profile-photo-input" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" hidden>
      `;
      const textColumn = profileHead.querySelector('[data-yw="c3JjL3BhZ2VzL0Rhc2hib2FyZFBhZ2UudHN4QDQ3OjE2"]') || profileHead.lastElementChild;
      (textColumn || profileHead).appendChild(actions);
    }

    const button = actions.querySelector('.ehm-profile-photo-change');
    const input = actions.querySelector('.ehm-profile-photo-input');
    if (button && button.dataset.bound !== '1') {
      button.dataset.bound = '1';
      button.addEventListener('click', () => input?.click());
    }
    if (avatar.dataset.photoBound !== '1') {
      avatar.dataset.photoBound = '1';
      avatar.setAttribute('role', 'button');
      avatar.setAttribute('tabindex', '0');
      avatar.setAttribute('aria-label', currentAvatarUrl ? 'Change profile picture' : 'Add profile picture');
      avatar.addEventListener('click', () => input?.click());
      avatar.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          input?.click();
        }
      });
    }
    if (input && input.dataset.bound !== '1') {
      input.dataset.bound = '1';
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        input.value = '';
        if (!file) return;
        await uploadProfilePicture(file);
      });
    }

    if (button && !button.disabled) button.textContent = currentAvatarUrl ? 'Change photo' : 'Add photo';
    avatar.setAttribute('aria-label', currentAvatarUrl ? 'Change profile picture' : 'Add profile picture');
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const url = URL.createObjectURL(file);
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('This image could not be opened.'));
      };
      image.src = url;
    });
  }

  function renderSquareDataUrl(image, size, mime, quality) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Image processing is not supported by this browser.');

    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const crop = Math.min(sourceWidth, sourceHeight);
    const sx = Math.max(0, (sourceWidth - crop) / 2);
    const sy = Math.max(0, (sourceHeight - crop) / 2);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(image, sx, sy, crop, crop, 0, 0, size, size);
    return canvas.toDataURL(mime, quality);
  }

  async function compressAvatar(file) {
    if (!file.type.startsWith('image/')) throw new Error('Please select an image file.');
    if (file.size > MAX_SOURCE_BYTES) throw new Error('Profile picture must be smaller than 8 MB.');

    const image = await loadImage(file);
    const attempts = [
      [192, 'image/webp', 0.78],
      [176, 'image/webp', 0.68],
      [160, 'image/webp', 0.58],
      [144, 'image/jpeg', 0.68],
      [128, 'image/jpeg', 0.58]
    ];

    let smallest = '';
    for (const [size, mime, quality] of attempts) {
      const dataUrl = renderSquareDataUrl(image, size, mime, quality);
      if (!smallest || dataUrl.length < smallest.length) smallest = dataUrl;
      if (dataUrl.length <= MAX_AVATAR_DATA_LENGTH) return dataUrl;
    }

    if (smallest && smallest.length <= 95000) return smallest;
    throw new Error('The selected image could not be compressed enough. Try a smaller photo.');
  }

  async function getClient() {
    if (window.supabaseClient?.auth) return window.supabaseClient;
    if (typeof window.waitForSupabaseClient === 'function') {
      return window.waitForSupabaseClient(10000);
    }
    throw new Error('Account service is not ready. Please refresh and try again.');
  }

  async function uploadProfilePicture(file) {
    setBusy(true);
    setStatus('Preparing photo...');
    try {
      const imageData = await compressAvatar(file);
      setStatus('Uploading photo...');

      const client = await getClient();
      const sessionResult = await client.auth.getSession();
      const session = sessionResult.data?.session;
      const user = session?.user;
      if (!user || !session.access_token) throw new Error('Please log in again to change your profile picture.');

      const response = await fetch('/api/upload-profile-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ imageData })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.avatarUrl) {
        throw new Error(payload.message || 'Could not upload profile picture.');
      }

      setStatus('Saving profile...');
      const metadata = payload.userMetadata || {
        ...(user.user_metadata || {}),
        avatar_url: payload.avatarUrl,
        avatar_updated_at: new Date().toISOString()
      };

      // The API saves metadata with the service role, so the photo persists
      // across browsers/devices even if the current client session is stale.
      currentUser = { ...user, user_metadata: metadata };
      currentAvatarUrl = payload.avatarUrl;
      try { localStorage.setItem(`ehemehe-avatar-${user.id}`, currentAvatarUrl); } catch (_) {}

      // Refresh the local Supabase session in the background. Do not turn a
      // successful upload into an error merely because token refresh is slow.
      try {
        const refreshed = await client.auth.refreshSession();
        if (refreshed?.data?.user) currentUser = refreshed.data.user;
      } catch (_) {}

      paintAvatar(document.querySelector(DASHBOARD_AVATAR), currentAvatarUrl, 'ehm-dashboard-profile-image');
      applyAvatarToHeader();
      setStatus('Photo updated', 'success');
      setTimeout(() => setStatus(''), 2200);
      window.dispatchEvent(new CustomEvent('ehemehe:profile-photo-updated', {
        detail: { userId: user.id, avatarUrl: currentAvatarUrl }
      }));
    } catch (error) {
      console.error('Profile picture update failed:', error);
      setStatus(error?.message || 'Could not update profile picture.', 'error');
    } finally {
      setBusy(false);
      queueRefresh();
    }
  }

  async function loadCurrentUser() {
    try {
      const client = await getClient();
      const result = await client.auth.getSession();
      currentUser = result.data?.session?.user || null;
      if (!currentUser) return;
      const metadataUrl = currentUser.user_metadata?.avatar_url || '';
      let cachedUrl = '';
      try { cachedUrl = localStorage.getItem(`ehemehe-avatar-${currentUser.id}`) || ''; } catch (_) {}
      currentAvatarUrl = metadataUrl || cachedUrl;
      if (metadataUrl) {
        try { localStorage.setItem(`ehemehe-avatar-${currentUser.id}`, metadataUrl); } catch (_) {}
      }
      queueRefresh();

      client.auth.onAuthStateChange((_event, session) => {
        currentUser = session?.user || null;
        let cachedUrl = '';
        try { cachedUrl = currentUser?.id ? (localStorage.getItem(`ehemehe-avatar-${currentUser.id}`) || '') : ''; } catch (_) {}
        currentAvatarUrl = currentUser?.user_metadata?.avatar_url || cachedUrl;
        queueRefresh();
      });
    } catch (error) {
      console.warn('Profile picture controls could not initialize:', error);
    }
  }

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver(queueRefresh);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function init() {
    startObserver();
    queueRefresh();
    loadCurrentUser();
    window.addEventListener('popstate', queueRefresh);
    window.addEventListener('ehemehe:auth-changed', loadCurrentUser);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
