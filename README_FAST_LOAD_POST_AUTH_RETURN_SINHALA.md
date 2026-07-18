# EheMehe.lk — Fast Home Load සහ Post Ad Auth Return Fix

## Root causes

1. Public React application එක සෑම route එකකම SMS settings ready වෙනතුරු බලා සිටියා.
2. Desktop final listing grid එක Ads, Promotions, Finance සහ Lookup requests හතරම අවසන් වනතුරු render නොවුණා.
3. Signed-out Post Ad check එක Post page scripts/Supabase load වූ පසුව පමණක් ක්‍රියා කළ නිසා form/page flash සහ ප්‍රමාදය ඇති විය.
4. Signup සාර්ථක වූ පසු Post Ad වෙත ආපසු යාමට අමතර 600ms delay එකක් තිබුණා.

## Fixes

- React boot එක SMS readiness එකෙන් වෙන් කළා.
- `/api/public-home` එකෙන් ads + promotions + banners parallel ලෙස එක් cached request එකකින් ලබාගන්නවා.
- Home request එක React import වීමට පෙර ආරම්භ වෙනවා.
- Finance/lookup data first listing paint එක block නොකර background එකේ refresh වෙනවා.
- Signed-out `/post` සහ `/post-ad` navigation first paint එකට පෙර `/signup?returnTo=/post` වෙත යනවා.
- Login සහ verified signup සාර්ථක වූ වහා saved return target එකට redirect වෙනවා.
- Post Ad local draft/state keys වෙනස් කරලා නැහැ.

## Validation

- Full regression suite: 30/30 passed, rounds 3.
- Signup/login/password reset/SMS OTP/Post Ad/Publish/Dashboard/Public listings/Admin tests passed.
