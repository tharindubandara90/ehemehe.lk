# EheMehe.lk — පරණ Desktop Layout සහ Live Ads Restore Fix

## Root cause

අන්තිම desktop වෙනසින් original React marketplace home page එක hide කර, වෙනම `desktop-olx-home.js` demo shell එකක් පෙන්වා තිබුණා. එය reference screenshot එකේ තිබුණු proven header/search/category/Latest Ads implementation එක නොවීය.

එම demo shell එක `/api/public-home` response එක මත පමණක් රඳා තිබුණා. API එකේ compact PostgREST select එකට optional promotion/finance column එකක් database schema එකේ නොතිබුණොත් query එක සම්පූර්ණයෙන් reject වී empty array එකක් ලැබුණා. Error එක suppress කර තිබුණු නිසා UI එක `0 listings found` ලෙස පෙන්වීය.

## Corrected implementation

- Independent demo desktop shell සහ CSS ඉවත් කර ඇත.
- Previous screenshot එකේ shared React + `index-filters` desktop implementation restore කර ඇත.
- Compact header/search/category row/Latest Ads cards නැවත පවතී.
- Mobile සහ අනෙකුත් React routes තවමත් එකම working application එක භාවිතා කරයි.
- `/api/public-home` preferred compact query fail වුවහොත් core compatible compact select එක භාවිතා කරයි.
- Approved/active/published legacy statuses case-insensitive server-side fallback එකකින් support කරයි.
- Pending/rejected ads public response එකට ඇතුළත් නොවේ.
- Base64 image arrays list endpoint එකෙන් download නොවේ.
- Vercel single-function deployment fix සහ stale API cleanup ආරක්ෂා කර ඇත.

## Validation

- Build verification passed.
- 23 connected regression tests passed three consecutive times.
- 13 main categories / 62 subcategories preserved.
- Auth, SMS OTP, password reset, Post Ad, District/City, publishing, My Ads, public details, favourites, reporting and admin tests passed.
