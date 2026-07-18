(() => {
  let currentSession = null;
  let storeWrapped = false;
  let retries = 0;
  let initialized = false;

  function normalizedUser(user) {
    if (!user) return null;
    const metadata = user.user_metadata || {};
    return {
      id: user.id,
      name: metadata.name || metadata.full_name || user.email?.split('@')[0] || user.phone || 'User',
      email: metadata.contact_email || metadata.email || (String(user.email || '').endsWith('@auth.ehemehe.lk') ? '' : (user.email || '')) || metadata.phone || '',
      phone: metadata.phone || user.phone || '',
      avatarUrl: metadata.avatar_url || metadata.avatarUrl || '',
      memberSince: user.created_at || new Date().toISOString()
    };
  }

  function applySessionToStore() {
    const store = window.__EHM_STORE;
    if (!store || typeof store.getState !== 'function') {
      if (retries++ < 80) setTimeout(applySessionToStore, 100);
      return;
    }

    const state = store.getState();

    if (!storeWrapped && state && typeof state.logout === 'function') {
      storeWrapped = true;
      const localLogout = state.logout;
      store.setState({
        logout: async () => {
          try { await window.supabaseClient?.auth?.signOut(); } catch (_) {}
          localLogout();
        }
      });
    }

    if (currentSession?.user) {
      const user = normalizedUser(currentSession.user);
      const latest = store.getState();
      const existing = latest.currentUser || {};
      const profileChanged =
        !latest.isAuthenticated ||
        existing.id !== user.id ||
        existing.name !== user.name ||
        existing.email !== user.email ||
        existing.phone !== user.phone ||
        existing.avatarUrl !== user.avatarUrl;
      if (profileChanged) latest.login(user);
    } else {
      const latest = store.getState();
      if (latest.isAuthenticated) latest.logout();
    }
  }

  async function initialize() {
    if (initialized) return;

    let client = window.supabaseClient;
    if (!client?.auth && typeof window.waitForSupabaseClient === 'function') {
      try { client = await window.waitForSupabaseClient(10000); }
      catch (_) { return; }
    }
    if (!client?.auth || initialized) return;

    initialized = true;
    const result = await client.auth.getSession();
    currentSession = result.data?.session || null;
    applySessionToStore();

    client.auth.onAuthStateChange((_event, session) => {
      currentSession = session || null;
      retries = 0;
      applySessionToStore();
    });
  }

  window.addEventListener('ehemehe:supabase-ready', initialize, { once: true });
  initialize();
})();
