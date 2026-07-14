/* EheMehe.lk Supabase browser configuration
 * The project URL is validated against the anon key project reference.
 */
const CONFIGURED_SUPABASE_URL = "https://ieymsjeywkapqeniirlm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlleW1zamV5d2thcHFlbmlpcmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MjkxOTQsImV4cCI6MjA5OTUwNTE5NH0.L2T1cEjznaeJHa4DVC9F8dA5c-e3P0OQ9U4vetJIeMM";

function decodeSupabaseProjectRef(key) {
  try {
    const payload = key.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
    return JSON.parse(atob(padded)).ref || '';
  } catch (error) {
    console.warn('Could not read Supabase project reference from the anon key.', error);
    return '';
  }
}

const SUPABASE_PROJECT_REF = decodeSupabaseProjectRef(SUPABASE_ANON_KEY);
const SUPABASE_URL = SUPABASE_PROJECT_REF
  ? `https://${SUPABASE_PROJECT_REF}.supabase.co`
  : CONFIGURED_SUPABASE_URL;

window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
window.supabaseClient = window.supabaseClient || null;
var supabaseClient = window.supabaseClient;

function createEhemeheSupabaseClient() {
  if (window.supabaseClient && typeof window.supabaseClient.from === 'function') {
    supabaseClient = window.supabaseClient;
    return window.supabaseClient;
  }

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    return null;
  }

  try {
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'ehemehe-auth'
      }
    });

    window.supabaseClient = client;
    window.ehemeheSupabase = client;
    supabaseClient = client;
    window.dispatchEvent(new CustomEvent('ehemehe:supabase-ready', { detail: client }));
    console.info('Supabase client ready for project:', SUPABASE_PROJECT_REF || 'configured project');
    return client;
  } catch (error) {
    console.error('Supabase client initialization failed:', error);
    return null;
  }
}

window.getSupabaseClient = createEhemeheSupabaseClient;
window.waitForSupabaseClient = function waitForSupabaseClient(timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const existing = createEhemeheSupabaseClient();
    if (existing) return resolve(existing);

    const timeout = window.setTimeout(() => {
      window.removeEventListener('ehemehe:supabase-ready', onReady);
      reject(new Error('Supabase client could not be initialized.'));
    }, timeoutMs);

    function onReady(event) {
      window.clearTimeout(timeout);
      resolve(event.detail || window.supabaseClient);
    }

    window.addEventListener('ehemehe:supabase-ready', onReady, { once: true });
  });
};

if (!createEhemeheSupabaseClient()) {
  window.addEventListener('load', createEhemeheSupabaseClient, { once: true });
  window.setTimeout(createEhemeheSupabaseClient, 250);
  window.setTimeout(createEhemeheSupabaseClient, 1000);
}
