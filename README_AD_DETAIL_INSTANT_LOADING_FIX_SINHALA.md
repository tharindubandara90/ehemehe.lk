# EheMehe.lk – Public Ad Detail Instant Loading Fix

## ගැටලුව

Supabase database ad එකක් click කළ විට React bundle එක මුලින් bundled/static ads array එකෙන් ID එක සොයන නිසා `Ad not found` page එක render වුණා. `index-filters.js` පසුව Supabase ad එක fetch කර එම content එක replace කළ නිසා තත්පර කිහිපයක් වැරදි not-found page එක පෙන්වුණා.

## Root causes

1. Selected ad එක fetch කිරීමට පෙර complete approved-ads list එක load වීම බලා සිටියා.
2. Finance settings සහ promotions queries ද first detail render එක block කළා.
3. Home listing එකේ දැනටමත් තිබුණු selected ad data එක route navigation එකට preserve කළේ නැහැ.
4. Database ad fetch එක අවසන් වනතුරු React temporary not-found state එක screen එකේ පෙන්වුණා.

## Fix

- Live listing card click එක capture කර selected normalized ad එක memory/session cache එකකට save කරනවා.
- `/ad/:id` page එකේ cache එකෙන් selected ad එක පළමුව ලබාගන්නවා.
- Cache නැති direct URL එකකදී complete list query එකට පෙර selected ID එකෙන් direct approved-ad query එක run කරනවා.
- Finance, promotions සහ complete ads list non-critical background work ලෙස load කරනවා.
- Database detail route එක pending වෙද්දී React main area එක hide කර controlled `Loading ad` state එක පෙන්වනවා.
- Supabase lookup එක ඇත්තටම අවසන් වූ පසු පමණක් genuine not-found state එක පෙන්විය හැක.
- Dynamic detail render වූ වහා pending state එක remove කරනවා.
- Base64-heavy listings sessionStorage quota ඉක්මවීම වැළැක්වීමට cache payload size guard එකක් එක් කළා.
- Permanent polling loop එකක් එක් කළේ නැහැ.

## Preserved flows

Authentication, SMS OTP, signup, password reset, Post Ad category fields, image upload, District/City, publishing, Dashboard My Ads, public mobile/desktop listings, admin functions සහ finance display වෙනස් නොකළා.

## Production note

Local/static regression validation සිදු කළා. Vercel live deployment සහ production Supabase timing මෙහිදී සෘජුව browser එකකින් test කළේ නැහැ.
