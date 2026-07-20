# EheMehe.lk — Safe Performance Optimization

මෙම update එකේ site එකේ visible layout, colors, button positions, user flows, database flows, React bundle, listing renderer, admin panel, OTP, dashboard, ad gallery සහ watermark behavior වෙනස් කර නැත.

## Applied improvements

- Valid `robots.txt`, `sitemap.xml`, and `llms.txt`
- Accessible viewport zoom (`maximum-scale=5`, `user-scalable=yes`)
- Removed the CSS `@import` dependency chain and loaded the same Plus Jakarta Sans stylesheet directly
- Added preconnects for Google Fonts, Supabase, and jsDelivr
- Added non-visual image loading safeguards:
  - first home/detail ad image receives `loading=eager` and `fetchpriority=high`
  - offscreen ad images receive `loading=lazy`
  - ad/logo images receive intrinsic dimensions to reduce layout shift
  - all images use asynchronous decoding
- Added accessible names to icon-only buttons without changing visible text
- Added long-lived cache headers for versioned JavaScript/CSS and safer reusable asset caching
- Added safe HSTS, MIME sniffing, framing, referrer, permissions, and DNS-prefetch headers
- Added versioned ad-image URLs so edited images do not reuse stale cached copies
- Added reduced-motion support only for users who request it in operating-system settings

## Intentionally not changed

To preserve every current feature and appearance, this update does not remove scripts, split routes, change card counts, change image quality, change API result limits, change colors, or restructure the DOM. Those larger architectural changes can create regressions and require a separate controlled phase.

## Verification

- Core React visual bundle unchanged
- Listing/search behavior file unchanged
- Admin behavior file unchanged
- Authentication behavior file unchanged
- Post Ad and dashboard edit behavior file unchanged
- Gallery behavior file unchanged
- 51 regression tests passed in each completed full-suite run
- 5 completed full-suite runs: 255/255 executions passed
- Performance-safe targeted test: 10/10 passed
