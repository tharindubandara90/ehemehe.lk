(() => {
  'use strict';

  const SETTINGS_CARD_SELECTOR = '[data-yw="c3JjL3BhZ2VzL0Rhc2hib2FyZFBhZ2UudHN4QDIwMzoxNg"]';
  const CARD_ID = 'ehm-account-delete-card';
  const MODAL_ID = 'ehm-account-delete-modal';
  let observer = null;
  let queued = false;
  let deleting = false;

  function cleanPath() {
    return location.pathname.replace(/\/index\.html$/i, '/').replace(/\/+$/, '') || '/';
  }

  function isSettingsRoute() {
    return cleanPath() === '/dashboard/settings';
  }

  async function client() {
    if (window.supabaseClient?.auth) return window.supabaseClient;
    if (typeof window.waitForSupabaseClient === 'function') return window.waitForSupabaseClient(7000);
    throw new Error('Account service is not ready. Refresh the page and try again.');
  }

  function settingsCard() {
    const exact = document.querySelector(SETTINGS_CARD_SELECTOR);
    if (exact) return exact;
    const heading = [...document.querySelectorAll('h1,h2')]
      .find((node) => /^profile settings$/i.test(String(node.textContent || '').trim()));
    return heading?.parentElement?.querySelector('.bg-white') || heading?.nextElementSibling || null;
  }

  function ensureModal() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.className = 'ehm-account-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="ehm-account-modal-backdrop" data-ehm-account-cancel></div>
      <section class="ehm-account-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="ehm-delete-title">
        <button type="button" class="ehm-account-modal-close" data-ehm-account-cancel aria-label="Close">×</button>
        <div class="ehm-account-warning-icon" aria-hidden="true">!</div>
        <h2 id="ehm-delete-title">Delete Account Permanently?</h2>
        <p>Your account and every ad posted by this account will be permanently removed. This cannot be undone.</p>
        <label for="ehm-delete-confirmation">Type <strong>DELETE</strong> to confirm</label>
        <input id="ehm-delete-confirmation" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="DELETE">
        <div class="ehm-account-delete-status" aria-live="polite"></div>
        <div class="ehm-account-modal-actions">
          <button type="button" class="ehm-account-cancel-button" data-ehm-account-cancel>Cancel</button>
          <button type="button" class="ehm-account-confirm-button" disabled>Delete Account</button>
        </div>
      </section>`;
    document.body.appendChild(modal);

    const input = modal.querySelector('#ehm-delete-confirmation');
    const confirm = modal.querySelector('.ehm-account-confirm-button');
    const status = modal.querySelector('.ehm-account-delete-status');

    const close = () => {
      if (deleting) return;
      modal.hidden = true;
      document.documentElement.classList.remove('ehm-account-modal-open');
      input.value = '';
      confirm.disabled = true;
      status.textContent = '';
      status.className = 'ehm-account-delete-status';
    };

    modal.querySelectorAll('[data-ehm-account-cancel]').forEach((button) => button.addEventListener('click', close));
    input.addEventListener('input', () => {
      confirm.disabled = input.value.trim().toUpperCase() !== 'DELETE' || deleting;
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !confirm.disabled) confirm.click();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !modal.hidden) close();
    });

    confirm.addEventListener('click', async () => {
      if (deleting || input.value.trim().toUpperCase() !== 'DELETE') return;
      deleting = true;
      confirm.disabled = true;
      confirm.textContent = 'Deleting...';
      status.className = 'ehm-account-delete-status';
      status.textContent = 'Removing your account and ads...';

      try {
        const supabase = await client();
        const sessionResult = await supabase.auth.getSession();
        const session = sessionResult?.data?.session;
        if (!session?.access_token) throw new Error('Your login session expired. Log in again and retry.');

        const response = await fetch('/api/delete-account', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ confirmation: 'DELETE' })
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload.ok === false) throw new Error(payload.message || 'Could not delete the account.');

        status.className = 'ehm-account-delete-status success';
        status.textContent = 'Account deleted. Redirecting...';
        try { await supabase.auth.signOut({ scope: 'local' }); } catch (_) {}

        try {
          Object.keys(localStorage).forEach((key) => {
            if (/^ehemehe[:_-]/i.test(key) || /^sb-.*-auth-token$/i.test(key)) localStorage.removeItem(key);
          });
          sessionStorage.clear();
        } catch (_) {}

        setTimeout(() => location.replace('/'), 350);
      } catch (error) {
        status.className = 'ehm-account-delete-status error';
        status.textContent = error?.message || 'Could not delete the account.';
        deleting = false;
        confirm.textContent = 'Delete Account';
        confirm.disabled = input.value.trim().toUpperCase() !== 'DELETE';
      }
    });

    return modal;
  }

  function openModal() {
    const modal = ensureModal();
    modal.hidden = false;
    document.documentElement.classList.add('ehm-account-modal-open');
    const input = modal.querySelector('#ehm-delete-confirmation');
    requestAnimationFrame(() => input?.focus());
  }

  function render() {
    queued = false;
    if (!isSettingsRoute()) return;
    const card = settingsCard();
    if (!card) return;

    // Remove the older prompt-based version if it was inserted by a cached script.
    card.querySelectorAll('.ehm-delete-account-card:not(#ehm-account-delete-card)').forEach((node) => node.remove());

    let section = document.getElementById(CARD_ID);
    if (!section || !card.contains(section)) {
      section?.remove();
      section = document.createElement('section');
      section.id = CARD_ID;
      section.className = 'ehm-delete-account-card ehm-delete-account-v2';
      section.innerHTML = `
        <div>
          <h3>Delete Account</h3>
          <p>Permanently delete your account and all ads posted from it.</p>
        </div>
        <button type="button" class="ehm-delete-account-button">Delete Account</button>`;
      card.appendChild(section);
      section.querySelector('button').addEventListener('click', openModal);
    }
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(render);
  }

  function init() {
    ensureModal();
    observer = new MutationObserver(queue);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    ['popstate', 'ehemehe:routechange', 'ehemehe:auth-changed'].forEach((name) => window.addEventListener(name, queue));
    queue();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
