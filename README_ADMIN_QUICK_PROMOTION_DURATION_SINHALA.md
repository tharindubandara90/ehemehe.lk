# Admin Quick Promotion Duration Fix

## වෙනස් කළ දේ

- Admin Ads card එකේ `Promote` button එක එක් කළා.
- Button එකෙන් compact popup එකක් open වෙනවා.
- Popup එකෙන් `Featured` හෝ `Promoted` තෝරාගන්න පුළුවන්.
- Promotion duration එක දින 1 සිට 365 දක්වා තෝරාගන්න පුළුවන්.
- Promotion එක `ad_promotions` table එකට start/end date සමඟ save වෙනවා.
- Promotion එක expire වුණාම stale `is_featured` / `is_promoted` flags public sorting එකට භාවිතා වෙන්නේ නැහැ.
- Featured ads category එකේ ඉහළින් සහ Promoted ads home page එකේ ඉහළින් පෙන්වන existing placement logic ආරක්ෂා කළා.
- Popup එකෙන් promotion එක ඉවත් කරන්නත් පුළුවන්.

## වෙනස් නොකළ දේ

Authentication, SMS OTP, signup, password reset, Post Ad, District/City, images, publishing, Dashboard My Ads, public ad details, admin preview සහ image removal flows වෙනස් කළේ නැහැ.
