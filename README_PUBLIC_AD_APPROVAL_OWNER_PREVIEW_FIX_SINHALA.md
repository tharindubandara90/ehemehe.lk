# Public Ad / Approval Root Fix

- Admin ad approve, reject, edit and delete operations now use the authenticated server API and Supabase service role instead of depending only on browser RLS.
- Anonymous users only receive approved/live listings.
- The signed-in owner or authorized staff can preview an exact pending ad URL without a false “Ad not found”.
- Public list queries fetch a wider pre-filter window so pending/rejected rows cannot crowd approved rows out of Home, All Ads, category and search pages.
- Direct ad requests and public listing requests remain no-store.

No new SQL migration is required for this patch. The Vercel project must retain its existing `SUPABASE_SERVICE_ROLE_KEY` environment variable used by the current publish API.
