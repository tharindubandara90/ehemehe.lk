# EheMehe.lk Tester Feedback Fix

## හඳුනාගත් root causes

1. Desktop Hero එකේ original Location select එක වෙනුවට runtime control එකක් දමා තිබුණත්, පසුව run වන stabilization pass එකේ generic location-select detector එක අලුත් EheMehe control එකත් native control එකක් ලෙස හඳුනාගෙන hide කළ හැකි විය. එම control දෙකේ options HTML එකත් නැවත නැවත replace කළ නිසා interaction සහ layout වැඩි විය.
2. Supabase Latest Ads section එක Browse Categories එකට පෙර inject විය. Bundled Featured Ads/Latest Ads sections ද වෙනම තිබීම නිසා desktop order එක සහ data source එක එකිනෙකට තරඟ කළා.
3. Search එක arbitrary substring matching භාවිතා කළ නිසා `cat` වැනි query එක `education` සහ `location` වැනි වචන ඇතුළත අකුරු සමඟ වැරදියට match විය.
4. Latest Ads card එකේ heart එක decorative element එකක් පමණක් විය. Click handler, persistent state සහ visual feedback නොතිබුණි.
5. React Ad Detail page එකේ `Report this ad` button එකට action එකක් නොතිබුණු අතර mobile CSS එකෙන් report wrapper එක hide කර තිබුණි.

## සිදු කළ නිවැරදි කිරීම්

- Desktop Hero native location control එකේ සම්පූර්ණ wrapper එක ඉවත් කර, stable Category/Location selects දෙකක් භාවිතා කළා.
- Later stabilization passes වලදී replacement selects නැවත hide හෝ rebuild නොවන guards එක් කළා.
- Dropdown arrow එක select එකේ දකුණු පැත්තේ මධ්‍යයට align කළා.
- Desktop order එක `Hero → Browse Categories → Latest Ads` ලෙස තහවුරු කළා.
- Bundled Featured Ads සහ duplicate Latest Ads sections hide කර Supabase-backed Latest Ads එක පමණක් පෙන්වනවා.
- Search එක word-prefix token matching එකකට මාරු කළා. `cat` දැන් `Cat/Cats` සමඟ match වෙන නමුත් `education/location` සමඟ match වෙන්නේ නැහැ.
- Multiple search words සියල්ල match වීම අනිවාර්ය කළා.
- Latest Ads favorites localStorage සහ existing React store දෙකට synchronize කරනවා.
- Heart click එක card navigation එක trigger නොකරයි; saved/removed feedback toast එකක් පෙන්වයි.
- Mobile සහ desktop දෙකේම `Report this ad` visible සහ clickable කළා.
- Report reason/details/email modal එකක්, server-side `/api/report-ad` endpoint එකක් සහ Supabase report storage migration එකක් එක් කළා.
- Report endpoint input validation, rate limiting සහ service-role-only database insert භාවිතා කරනවා.

## Database step

`public.ad_reports` table එක කලින් `supabase_admin_enterprise_schema.sql` මගින් තිබේ නම් අලුත් table එකක් අවශ්‍ය නැහැ. නොතිබේ නම් `supabase_public_interactions_schema.sql` එක Supabase SQL Editor එකේ එක් වරක් run කරන්න.

## Validation

- Full JavaScript syntax validation
- Search false-positive/positive functional cases
- Desktop control persistence and section-order guards
- Favorite delegated click/persistence checks
- Report modal/API validation and mocked successful Supabase insert
- Existing authentication, OTP, Post Ad, categories, publish, Dashboard, admin, public ad detail and HTTP regression suites
