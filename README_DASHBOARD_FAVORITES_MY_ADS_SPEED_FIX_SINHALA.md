# EheMehe.lk Dashboard Favorites සහ My Ads Speed Fix

## Root causes

1. Dashboard Favorites route එක වෙනස් වූ මොහොතේ React tab DOM එක තවම mount වී නොතිබුණු නිසා Favorites renderer එක heading එක හමු නොවී නවතිනවා. Manual refresh එකේ route එක මුල සිට correct වූ නිසා එය පෙන්වුණා.
2. Favorites data `/api/public-home` සහ `static-ads.json` එකින් එක sequential ලෙස load කළ නිසා පළමු render එක ප්‍රමාද වුණා.
3. My Ads request එක ක්‍රියාත්මක වෙමින් තිබියදී තවත් dashboard tick එකක් ආවොත් loader එක request promise එක await නොකර හිස් `runtime.dashboardAds` return කළා.
4. `/api/my-ads` endpoint එක signed-in userගේ ads database query එකෙන් filter නොකර marketplace ads 500ක් `select=*` ලෙස download කර server එකේ filter කළා.
5. Dashboard loader එකට already-resolved Supabase auth session එක ලබාගන්න shared auth-ready state/event එකක් නොතිබුණා.

## Fixes

- Favorites route React DOM mount එක bounded retries (`0, 16, 60, 140, 300, 600ms`) සමඟ synchronize කරයි.
- Home page live snapshot cache එකෙන් Favorites වහා paint කරයි.
- Public ads API සහ static ads requests parallel ලෙස load කරයි.
- My Ads duplicate calls එකම in-flight Promise එක share කරයි.
- Auth session ready වූ වහා My Ads prefetch කරයි.
- `/api/my-ads` Supabase query එක `user_id` අනුව database-level filter කරයි.
- My Ads list එකට immediate loading state එකක් පෙන්වයි; sample/empty list flash නොවේ.
- Permanent polling loop එකක් එක් කර නැහැ.

## Validation

- Full regression suite: 37/37 passed, complete passes 3.
- Targeted Favorites/My Ads regression: 10/10 passed.
- JavaScript syntax checks: passed.
