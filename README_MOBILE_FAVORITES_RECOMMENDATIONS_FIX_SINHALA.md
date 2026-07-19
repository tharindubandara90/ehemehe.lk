# Mobile Favorites සහ Duplicate Recommendations Fix

## Root causes

1. Managed mobile home එක original React home sections hide කළත් `Fresh recommendations` heading එක hide list එකේ නොතිබුණා. ඒ නිසා `Recently added listings` managed grid එකට පසුව duplicate Fresh recommendations section එකත් පෙන්වුණා.
2. Bottom navigation එකේ original Categories link එක Favorites ලෙස rename කර `href` වෙනස් කළත් React click handler එක ඉතිරි වුණා. ඒ handler එක Favorites route navigation එකට පෙර run වීම නිසා click එක refresh/re-render එකක් වගේ හැසිරුණා.

## Fix

- Mobile home එකේ original `Fresh recommendations` section එක managed hidden section එකක් ලෙස සලකනවා.
- Bottom-nav Favorites click එක capture phase එකේ intercept කර `/dashboard/favorites` වෙත clean navigation කරනවා.
- Original React click handler එකට event එක යන්නේ නැහැ.
- Desktop recommendations, banner, ads, auth, OTP, Post Ad සහ admin flows වෙනස් කරලා නැහැ.
