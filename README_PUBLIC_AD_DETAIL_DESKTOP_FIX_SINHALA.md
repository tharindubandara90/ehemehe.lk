# Public Ad Detail සහ Desktop Live Ads Fix

## Root cause

1. Mobile latest listings `index-filters.js` මගින් Supabase `ads` table එකෙන් load වුණා.
2. React `AdDetailPage` component එක database එක query නොකර bundled sample ads array එක පමණක් `id` අනුව සෙව්වා.
3. Database ad UUID එක bundled array එකේ නොමැති නිසා `/ad/<uuid>` route එක `Ad not found` ලෙස පෙන්වුණා.
4. Desktop live-ad results host එක render කළේ active banner එකක් තිබුණොත් පමණයි. එනිසා mobile එකේ පෙනුණු Supabase ads desktop එකේ පෙනුණේ නැහැ.
5. Relationship metadata/schema cache query එක fail වුණොත් live ads සියල්ල අතුරුදහන් වන fallback gap එකක් ද තිබුණා.

## Fix

- Approved database ad එක current route ID එකෙන් සෘජුව fetch කරනවා.
- React not-found content එක පමණක් database-backed responsive detail content එකෙන් replace කරනවා; header/footer/mobile navigation ආරක්ෂා වේ.
- Multiple images, description, category details, location, condition (අදාළ විට පමණක්), seller contacts සහ vehicle finance පෙන්වයි.
- Home list සහ detail route එක එකම Supabase ad ID භාවිතා කරනවා.
- Relationship query fail වුණොත් plain `ads` select fallback එක භාවිතා කරනවා.
- Desktop latest live-ad grid එක banner එකක් නොතිබුණත් render වෙනවා.
- Initial desktop load එකේ auto-scroll නොකරයි.
- Permanent polling loop එකක් එක් කර නැහැ.

## Production limitation

Automated/local tests live Supabase production data වෙනස් නොකරයි. Production Vercel deployment එකෙන් පසුව approved ad එකක් mobile සහ desktop දෙකෙන් open කර smoke-test කරන්න.
