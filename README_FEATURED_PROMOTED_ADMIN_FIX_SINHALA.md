# EheMehe Featured / Promoted Ads සහ Admin Ad Management Fix

## Root cause

Database එකේ promotion flags `is_featured`, `is_promoted` සහ `promotion_type` ලෙස තිබුණත් public listing normalization එකේ legacy `featured` / `promoted` names පමණක් විශ්වාස කළ තැන් තිබුණා. Admin edit modal එකේ promotion type එක පැහැදිලිව තෝරා save කිරීමක් නොතිබුණු අතර existing images එකින් එක ඉවත් කිරීම සහ listing preview එකත් සම්පූර්ණ flow එකක් ලෙස සම්බන්ධ වී තිබුණේ නැහැ.

## සිදු කළ වෙනස්කම්

- Home page එකේ unfiltered desktop/mobile listings වල Promoted ads පළමුව, අනෙක් ads created date අනුව පසුව පෙන්වයි.
- Category filter එකක් active වූ විට එම category එකේ Featured ads පළමුව, අනෙක් ads created date අනුව පසුව පෙන්වයි.
- Public API සහ browser normalization දෙකම snake_case, camelCase සහ legacy promotion fields කියවයි.
- Admin edit modal එකේ Normal / Featured / Promoted selector එකක් ඇත.
- Admin save payload එක `promotion_type`, `is_featured`, `is_promoted` නිවැරදිව save කරයි.
- Admin ad card එක click කිරීමෙන් හෝ Preview button එකෙන් listing preview modal එක open වේ.
- Admin edit modal එකේ current images පෙන්වයි; image එකින් එක Remove කළ හැක; ඉතිරි images සහ primary `image_url` save වේ.
- Desktop Fresh recommendations layout එකේ card size, grid size සහ image ratio වෙනස් කර නැහැ.

## Validation

- JavaScript syntax checks pass.
- Promotion placement regression pass.
- Admin preview regression pass.
- Admin image add/remove/save regression pass.
- Public/mobile/desktop/auth/OTP/Post Ad/Admin connected regression suite: 28/28 pass.
