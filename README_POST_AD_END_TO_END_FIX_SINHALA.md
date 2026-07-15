# Post Ad End-to-End Fix

හඳුනාගත් root causes:
- Add Photo button එක `window.ehmPostAdImagePicker` call කළත් latest helper එකෙන් එම function එක නැති වී තිබුණා.
- City helper එක `/post-ad` route එකට විතරක් run වුණා. Live React page එක `/post`.
- Multiple phone OTP implementation එක fallback `post-ad.html` page එකට විතරක් තිබුණා.
- React Post Ad button එක database එකට save නොකර success screen එක පමණක් පෙන්වා තිබුණා.
- Dashboard My Ads sample ads 3ක් hard-code කර තිබුණා.
- Password reset page එක `window.EHM_OTP` call කළත් otp-client එක එය window object එකට assign කර තිබුණේ නැහැ.

දැන්:
- Add Photo click කළාම native file browser එක open වේ.
- Images 10ක් දක්වා high-quality client optimization කරයි.
- District select කළ පසු City/Town dropdown එක පෙන්වයි.
- Contact number 1-5 දක්වා add කළ හැකි අතර සෑම number එකක්ම SMS OTP verify කළ යුතුය.
- සියලු numbers verify නොකර Contact step එකෙන් හෝ Publish එකෙන් ඉදිරියට යා නොහැක.
- Publish API එක authenticated Supabase user session එක verify කර ad එක pending ලෙස database එකට save කරයි.
- User Dashboard > My Ads තුළ signed-in userගේ සැබෑ ads පෙන්වයි.
- Password Reset SMS OTP client error එක fix කර ඇත.

Supabase SQL Editor එකේ `supabase_post_ad_end_to_end.sql` එක එකවර run කිරීම නිර්දේශ කරයි.
