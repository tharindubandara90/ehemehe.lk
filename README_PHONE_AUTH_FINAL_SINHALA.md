# Phone OTP + Login Final Fix

- Text.lk SMS OTP එක භාවිත කරයි.
- Supabase Phone Provider / Twilio අවශ්‍ය නැහැ.
- Correct OTP verify කළ පසුව account එක internal confirmed email identity එකකින් create වේ.
- Userට phone number හෝ optional contact email + password මගින් login විය හැක.
- Server එක real Supabase session tokens return කරන අතර browser එක auth.setSession මගින් session එක save කරයි.
- කලින් phone-only ලෙස create වූ accounts ඊළඟ login එකේ automatic migrate වේ.
- TEXTLK_API_TOKEN code/ZIP එකට දාන්නේ නැහැ; Vercel Environment Variable එකේම තබන්න.
