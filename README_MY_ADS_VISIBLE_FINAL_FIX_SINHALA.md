# EheMehe.lk — My Ads visible list final fix

## Root cause

React dashboard එකේ My Ads native list එක hide කළ පසු managed list එක visible tab wrapper එකට නොව global `<main>` element එකේ අගට append කර තිබුණා. එනිසා My Ads tab එක හිස් වුණා.

තව පැරණි schema compatibility publish path එකෙන් save වූ ads වල ownership `user_id` column එකේ නොව `custom_fields.owner_user_id` තුළ පමණක් තිබිය හැක. My Ads API එක `user_id` filter එක පමණක් භාවිතා කළ නිසා එවැනි ads list එකට නොලැබුණා.

## Fix

- Managed My Ads panel එක native My Ads list එක තිබෙන exact tab wrapper එකට mount කරනවා.
- Managed panel එක mount සහ initial loading state paint වූ පසුව පමණක් bundled sample list එක hide කරනවා.
- Global dashboard `<main>` හරහා unrelated `.space-y-4` lists hide කිරීම ඉවත් කළා.
- API එක `user_id` ownership query පළමුව භාවිතා කරනවා.
- Direct query හිස්/unsupported නම් `custom_fields.owner_user_id` fallback query එක භාවිතා කරනවා.
- ඉතා පැරණි schema එකක් සඳහා compact compatibility scan එකක් තිබෙනවා.
- Full image arrays download නොකර `/api/ad-image` lazy image path එකම භාවිතා කරනවා.

## Scope

Home, authentication, OTP, Post Ad, public ads, banner, promotions, admin සහ අනෙක් dashboard tabs වෙනස් කර නැහැ.
