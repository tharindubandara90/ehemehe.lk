# Dashboard My Ads සහ View Favorites Fix

## Root causes

1. Dashboard Quick Actions හි `View Favorites` label එක route map එකේ තිබුණේ නැහැ. `Favorites` label එක පමණක් තිබුණු නිසා button click එක `/dashboard/favorites` වෙත යොමු වුණේ නැහැ.
2. My Ads page එකේ immediate loading/list container එක React DOM structure එක මත අවදානම් parent lookup එකකින් insert කළා. සමහර desktop layouts වල container එක පෙන්වුණේ නැහැ.
3. `/api/my-ads` `select=*` භාවිතා කර Base64 `images` සහ `image_url` data එකත් download කළා. Ads කිහිපයක් තිබුණත් payload එක විශාල විය හැකි නිසා list එක පෙන්වීමට ප්‍රමාද වුණා.
4. Dashboard එක reopen කළ විට පසුගිය successful My Ads result එකෙන් immediate paint කිරීමක් තිබුණේ නැහැ.

## Fixes

- `View Favorites` quick action එක `/dashboard/favorites` route එකට map කළා.
- `/dashboard/ads` හි loading/list panel එක heading එක render වූ වහා stable `main` container එකට insert කරනවා.
- User-specific 15-minute My Ads cache එකක් එක් කළා. Cached list එක වහා පෙන්වා network refresh එක background එකේ කරනවා.
- Auth-ready event එකේදී cache hydrate කර My Ads prefetch කරනවා.
- Duplicate My Ads requests එකම in-flight promise එක share කරනවා.
- API query එක compact columns පමණක් ලබාගන්නා ලෙස වෙනස් කළා.
- Base64 image arrays list response එකෙන් ඉවත් කර `/api/ad-image` හරහා images lazy-load කරනවා.
- Editing, deleting, ownership checks සහ status flow වෙනස් කළේ නැහැ.

## Validation

- Full regression suite: 38/38 passed (3 complete runs including build verification)
- Dashboard targeted Favorites/My Ads test: 10/10 passed
- No permanent polling loop added
