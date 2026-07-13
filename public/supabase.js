const SUPABASE_URL = "https://fswzlqibovkjmprddxbf.supabase.co";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzd3pscWlib3Zram1wcmRkeGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNDAzNDUsImV4cCI6MjA5NzYxNjM0NX0.103k-T9kjqrpM_eCsv69hJ1OGVf0MmH1_pqiXSvN_GU";

var supabaseClient = null;

if (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
} else {
  console.warn("Supabase SDK is not loaded or configuration is missing.");
}
