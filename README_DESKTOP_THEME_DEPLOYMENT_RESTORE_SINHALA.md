# EheMehe.lk Desktop Theme Deployment Restore

## සිදුවූ ගැටලුව

Windows `Replace files` ක්‍රමයෙන් අලුත් ZIP එක පරණ Git project folder එකට copy කළ විට,
ZIP එකේ නොමැති පරණ `dist`, `build`, `.vercel/output` සහ root `index.html` වැනි
frontend output files delete නොවේ. Vercel project එකේ පැරණි Framework/Output Directory setting
එවැනි folder එකකට යොමු වී තිබුණොත් backend අලුත් commit එකෙන් deploy වුවත් frontend එක
පරණ theme එකෙන් පෙන්විය හැක.

## මෙම version එකේ ආරක්ෂාව

- Build කිරීමට පෙර stale frontend output directories delete කරයි.
- Vercel Framework Preset එක `Other` (`framework: null`) ලෙස repository එකෙන් override කරයි.
- Vercel Output Directory එක `public` ලෙස repository එකෙන් override කරයි.
- Home HTML response එක cache නොවන ලෙස සකස් කරයි.
- `desktop-home-critical-v4.js` React bundle එකට කලින් load වී අලුත් desktop shell එක first paint එකේම සකස් කරයි.
- Full desktop helper එක build output එකේ නොමැති නම් build එක fail වේ.

## Apply කිරීම

Project root එකේ `APPLY_DESKTOP_THEME_FIX.cmd` double-click කළ හැක. එය cleanup, build සහ tests run කරයි.
ඉන්පසු Git commands run කරන්න.
