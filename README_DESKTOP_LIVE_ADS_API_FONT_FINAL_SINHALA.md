# EheMehe.lk Desktop Live Ads / API / Typography Final Fix

## Production symptom

Desktop compact home page rendered correctly, but `Latest Ads` displayed:

- `Listings could not be loaded`
- `Could not load listings`

The desktop typography also appeared artificially heavy and inconsistent with the earlier working compact desktop screenshot.

## Confirmed root causes

1. `vercel.json` explicitly set `outputDirectory: "public"`. This made the deployment configuration static-output-oriented while the application also depended on the root `server.js` for `/api/public-home`, `/api/public-meta`, OTP, publish, dashboard and other APIs.
2. `server.listen()` was hidden behind a helper and an environment condition instead of being called directly during root module startup. This made Vercel root-server detection less reliable.
3. The desktop home had only one data path: `/api/public-home`. When that endpoint was unavailable, the whole live grid became an error panel even though public Supabase RLS could still provide approved ads.
4. Desktop CSS requested synthetic `850` and `900` weights while the declared web fonts were not bundled. The fallback font synthesized excessively thick text.
5. Earlier tests validated the handler module and static layout markers, but did not assert the exact Vercel static-output/API conflict or require a second live-listing data path.

## Fixes

- Removed `outputDirectory` from `vercel.json`.
- Kept `framework: null`, deterministic install and explicit build command.
- Changed root `server.js` to create the single HTTP server and call `server.listen()` during module startup.
- Preserved one Vercel server function and all existing `/api/...` URLs.
- Added direct, read-only Supabase REST fallback to the desktop listings loader using the public anon role and existing RLS.
- Added compatible projections for databases with older optional columns.
- Kept the optimized `/api/public-home` path as the primary path.
- Made `sharp` lazy in `public-home` so an optional native-image conversion issue cannot stop the API module from loading.
- Added Supabase request timeouts and server-side diagnostics.
- Replaced synthetic 850/900 weights with stable 500/600/700 weights.
- Changed the desktop typography stack to Segoe UI / Arial / Helvetica with font smoothing and no synthetic weight generation.
- Added a dedicated live ads delivery regression test covering the Vercel config, root server, API handler, listing image and direct client fallback.

## Validation

- JavaScript syntax: passed
- Clean build: passed
- Desktop live ads API handler with mocked Supabase: passed
- Direct Supabase fallback presence: passed
- One Vercel server function structure: passed
- Authentication / OTP / password reset: passed
- 13 main categories / 62 subcategories: passed
- Post Ad / District-City / image upload / publish: passed
- Dashboard My Ads / admin / public ad details: passed
- Footer / LCP / cache / compression regressions: passed
- Full build + 25-test suite: passed 10 consecutive times

The production Vercel deployment itself was not executed from this environment. After pushing, verify `/api/public-home` in the browser Network tab and confirm it returns JSON with `ok: true` and an `ads` array.
