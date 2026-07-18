# Desktop View Stability Fix

මෙම update එකේ වෙනස් කළේ desktop home view එක load වූ පසු පරණ React/green Hero view එකට මාරුවන ගැටලුව පමණයි.

## Root cause

- `public/index.html` desktop home එකේත් React bundle එක mount කළා.
- `public/index-filters.js` DOMContentLoaded පසු සහ 300ms / 900ms delayed sync දෙකෙන් desktop home DOM එක නැවත සකස් කළා.
- එහි MutationObserver එක React hydration වෙනස්කම් පසුවත් desktop shell එක නැවත rewrite කළා.
- `public/brand-theme.js` හි වෙනම MutationObserver එකත් එම desktop DOM එකට බලපෑවා.
- Project එකේ stable compact desktop implementation (`desktop-home-exact.js`) තිබුණත් current HTML එකෙන් එය load කරලා තිබුණේ නැහැ.

## Fix

- Desktop `/` route එකට physical-device based එකම owner එකක් first paint එකට පෙර lock කළා.
- Desktop home එකේ React bundle mount වීම නතර කළා.
- Stable desktop host එක root එකෙන් වෙන් කර සෘජුව load කළා.
- `index-filters.js` සහ `brand-theme.js` desktop exact home එකේ early-return කරන guards එක් කළා.
- Mobile සහ අනෙක් සියලු routes වල පවතින React/helpers වෙනස් නොකළා.
- Content-hash cache versions වලට exact desktop CSS/JS එක් කළා.

## Validation

- Full regression suite: 19/19 passed, consecutive runs 3.
- Focused desktop owner stability test: 10/10 passed.
- Browser DOM race simulation: 0ms, 100ms, 500ms, 1200ms සහ 3000ms වලදී React root hidden සහ compact desktop host visible ලෙසම පැවතුණා.
