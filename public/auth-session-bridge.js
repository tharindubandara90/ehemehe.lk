(() => {
  let currentSession = null;
  let storeWrapped = false;
  let retries = 0;

  function normalizedUser(user) {
    if (!user) return null;
    const metadata = user.user_metadata || {};
    return {
      id: user.id,
      name: metadata.name || metadata.full_name || user.email?.split('@')[0] || user.phone || 'User',
      email: user.email || metadata.email || '',
      phone: user.phone || metadata.phone || '',
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
      if (!latest.isAuthenticated || latest.currentUser?.id !== user.id) {
        latest.login(user);
      }
    } else {
      const latest = store.getState();
      if (latest.isAuthenticated) latest.logout();
    }
  }

  async function initialize() {
    if (!window.supabaseClient?.auth) {
      setTimeout(initialize, 100);
      return;
    }

    const result = await window.supabaseClient.auth.getSession();
    currentSession = result.data?.session || null;
    applySessionToStore();

    window.supabaseClient.auth.onAuthStateChange((_event, session) => {
      currentSession = session || null;
      retries = 0;
      applySessionToStore();
    });
  }

  initialize();
})();
