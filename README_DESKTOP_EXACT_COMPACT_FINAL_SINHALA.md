# EheMehe.lk Exact Compact Desktop Home — Final Fix

## අවශ්‍ය Desktop layout

- White compact header
- EheMehe logo
- Favorites / Post an Ad / Account
- Search / All categories / Location / Search එකම පේළියේ
- Circular category shortcuts
- Latest Ads
- Live database ads columns 4කින්

## හඳුනාගත් වැරදි

1. කලින් restore කළ React bundle එක තුළ green Hero එක තවම තිබුණා.
2. `index-filters.js` Hero එක ඉවත් නොකර එහි controls පමණක් වෙනස් කළා.
3. React, desktop mutation helper සහ theme helper first paint එකේ එකිනෙකට තරඟ කළා.
4. වෙනම දාපු OLX demo shell එක user ඉල්ලූ screenshot එකේ design එක නොවූ අතර API compatibility error එකකදී ads 0 ලෙස පෙන්වීය.

## දැන් source ownership

- Desktop home (`/`, width >= 1024px): `desktop-home-exact.min.js` + `desktop-home-exact.css`
- Mobile/tablet home: existing React application
- Post Ad, Dashboard, Ad Details, Auth, Admin: existing working implementations

Desktop home එකේ React green Hero, old desktop DOM rewriter, `brand-theme.js` සහ lazy browser Supabase SDK load නොවේ. Live data same-origin server APIs මගින් ලබාගනී.

## Validation

- Build verification: 10/10
- Full connected regression suite: 23/23 × 10
- Browser interaction/viewport test: 10/10
- Tested desktop widths: 1024, 1100, 1147, 1366, 1440, 1883
- Mobile isolation: 390px
- Static ad route shells: 100
