# Desktop home milliseconds පසු පරණ layout එකට මාරුවීමේ අවසාන fix එක

## Root cause
Desktop home ownership එක `matchMedia('(min-width:1024px)')` මත තීරණය කර තිබුණා. Browser zoom, scrollbar, DevTools හෝ viewport settling නිසා width එක 1024px සීමාව හරහා මාරු වූ විට `location.reload()` run වුණා. Reload වූ page එක React home එක start කළ නිසා compact desktop page එක milliseconds කිහිපයකින් green/pරණ layout එකට මාරු වුණා.

## Fix
- Desktop/mobile ownership physical-device detection එකෙන් එක වරක් තීරණය කරනවා.
- Desktop ownership CSS viewport width මත වෙනස් වෙන්නේ නැහැ.
- Breakpoint change `location.reload()` සම්පූර්ණයෙන් ඉවත් කළා.
- Desktop helper synchronous ලෙස host එකට පසු run වෙනවා.
- React `#root` desktop home එකේ `hidden` කර ownership lock එකක් යොදා ඇත.
- Exact desktop CSS එක 1024px media query එකෙන් පිටතට ගෙනාවා.
- Browser zoom නිසා CSS viewport එක 1024pxට අඩු වුවත් compact desktop layout responsive ලෙස පවතිනවා.
