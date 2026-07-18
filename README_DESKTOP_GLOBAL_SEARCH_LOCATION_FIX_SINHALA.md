# Desktop Global Search + Location Fix

## වෙනස් කළ දේ

- Desktop search bar එකෙන් `All Categories` dropdown එක ඉවත් කළා.
- Search text එකක් තිබෙන විට category filter එක නොසලකා සියලු categories අතර search කරනවා.
- District හෝ City selection එකක් තිබුණොත් text results එම location එකට පමණක් සීමා වෙනවා.
- Search text එක හිස් විට category shortcut filters සාමාන්‍ය ලෙස තවම වැඩ කරනවා.
- Mobile filter/category UI එක වෙනස් කළේ නැහැ.

## උදාහරණ

- `TV` → Sri Lanka පුරා TV ads.
- `TV` + `Kandy` → Kandy location එකේ TV ads පමණයි.
- `TV` + `Kandy > Peradeniya` → Peradeniya TV ads පමණයි.

## Root cause

Desktop category selector එක `index-filters.js` සහ `brand-theme.js` දෙකෙන්ම inject කිරීමට හැකිව තිබුණා. Search filtering එකත් leftover category state එක සමඟ combine වූ නිසා text query එක all-category search එකක් නොවීමට ඉඩ තිබුණා. Implementations දෙකම remove කර desktop text search එක global ලෙස සකස් කළා.
