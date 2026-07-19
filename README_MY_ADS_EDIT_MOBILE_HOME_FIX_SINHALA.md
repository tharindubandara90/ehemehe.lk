# EheMehe.lk — My Ads Edit සහ Mobile Home Navigation Fix

## Root causes

1. Dashboard එකේ React විසින් render කරන pencil/edit icon එකට click action එකක් නොතිබුණා. User-specific ads API එකෙන් load කරන runtime edit modal එක වෙනම generated `Edit Ad` button එකකට පමණක් bind කර තිබුණා. Mobile UI එකේ පෙනෙන original pencil icon එක ඒ handler එකට සම්බන්ධ නොවූ නිසා click කළත් කිසිවක් සිදු වුණේ නැහැ.
2. Dashboard route එකෙන් mobile bottom navigation එකේ Home click කළ විට React SPA route එක පමණක් මාරු වුණා. Managed mobile home filter/results UI එක mount වීමට පෙර route sync එක run වීම සහ එම mutation එක sync guard එකෙන් skip වීම නිසා header/search පමණක් ඇති අර්ධ-rendered white page එකක් ඉතිරි වුණා. Full refresh එකෙන් clean initialization වන නිසා refresh කළාම හරි වුණා.

## Changes

- Original dashboard pencil icon එක හඳුනාගෙන signed-in userගේ real ad ID එකට match කරන handler එක එක් කළා.
- Match කිරීම ID, full title, image URL සහ price අනුව guarded fallback වලින් සිදු වෙනවා.
- Pencil click කළ විට protected `/api/update-my-ad` flow භාවිතා කරන existing edit modal එක open වෙනවා.
- Mobile bottom navigation Home click එක clean document navigation එකකට මාරු කළා, එනිසා half-mounted SPA home state එක නැහැ.
- Browser back/history route එක සඳහා bounded recovery retries 6ක් එක් කළා. Permanent polling loop එකක් එක් කළේ නැහැ.
- Authentication, OTP, Post Ad, ads ordering, desktop search, admin සහ other routes වෙනස් කළේ නැහැ.

## Validation

- JavaScript syntax passed.
- Full build passed.
- 32/32 regression tests passed three consecutive runs.
- User ad update API ownership/pending-review regression passed.
- Mobile Home navigation regression passed.
