# EheMehe.lk — My Ads permanent visible + Supabase schema-cache fix

## සොයාගත් ප්‍රධාන ගැටලු

1. My Ads සඳහා අලුතින් inject කළ list panel එක React dashboard එකේ පසුව සිදුවන re-render එකකදී ඉවත් විය හැකි වුණා. ඒ අතර native list එක `hidden` කර තිබූ නිසා page එක සම්පූර්ණයෙන් හිස්ව පෙනුණා.
2. පැරණි Supabase schema එකක `ads.user_id` column එක නොමැති විට PostgREST විසින් `PGRST204` සහ `schema cache` error එක ලබාදෙනවා. පෙර handler එක එම error format එක missing-column error එකක් ලෙස හඳුනා නොගත් නිසා `custom_fields.owner_user_id` fallback එකට නොගොස් My Ads API එක fail වුණා.

## කළ නිවැරදි කිරීම

- React native My Ads list එකම permanent managed mount point එක ලෙස භාවිතා කරනවා.
- Native list එක තවදුරටත් hide කරන්නේ නැහැ.
- React re-render එකකින් managed child content ඉවත් වුණත් signature එක එකම වුවද content නැවත paint කරනවා.
- `PGRST204`, `42703`, `schema cache`, සහ Supabase missing-column message patterns හඳුනාගන්න API compatibility logic එක පුළුල් කළා.
- `user_id` column එක නොමැති විට `custom_fields.owner_user_id` query එකට වහාම fallback වෙනවා.
- Full image arrays download නොකර `/api/ad-image` lazy loading strategy එක එලෙසම තබා ඇත.

## වෙනස් නොකළ කොටස්

Home page, search, Favorites, Messages, Settings, Post Ad, authentication, OTP, admin dashboard, promotions, banner ads සහ අනෙකුත් site functions වෙනස් කර නැහැ.

## Validation

- Full regression suite: 41/41 passed
- Full suite passes: 3
- Targeted My Ads tests: 10/10 repeated runs
- JavaScript syntax checks: passed
- Asset version hash verification: passed
- Build and route shell synchronization: passed
