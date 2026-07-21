# My Ads final root-cause fix

මෙම build එකෙන් `/dashboard/ads` My Ads list එක render නොවීම සහ initial count එක 3 සිට 19 දක්වා වෙනස් වීම නිවැරදි කර ඇත.

- My Ads API ownership එක `custom_fields.owner_user_id` මත canonical ලෙස තීරණය කරයි.
- පරණ/imported demo ads වල shared `user_id` values My Ads ලෙස ගණන් නොගනී.
- පරණ v1/v2 My Ads caches ඉවත් කර v3 user-specific cache එක භාවිතා කරයි.
- API request එක අතරතුර React dashboard tab එක නැවත mount වුණත් visible panel එක නැවත resolve කර paint කරයි.
- API error එකක් තිබුණොත් හිස් page එකක් වෙනුවට retry state එක පෙන්වයි.
- Images lazy `/api/ad-image` endpoint එකෙන් load වේ.
