const SUPABASE_URL = "https://fswzlqibovkjmprddxbf.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlleW1zamV5d2thcHFlbmlpcmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MjkxOTQsImV4cCI6MjA5OTUwNTE5NH0.L2T1cEjznaeJHa4DVC9F8dA5c-e3P0OQ9U4vetJIeMM";

window.supabaseClient = null;

if (
  window.supabase &&
  SUPABASE_URL &&
  SUPABASE_ANON_KEY
) {
  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  console.log("Supabase connected successfully");
} else {
  console.error(
    "Supabase SDK is not loaded or configuration is missing."
  );
}