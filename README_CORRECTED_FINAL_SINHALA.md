# Corrected Final Project

මෙම version එක latest project එක මතම fix කරලා තිබෙන නිසා කලින් changes remove කරලා නැහැ.

Fix කළ ප්‍රධාන දේ:
- Seller phone number එක Call Now button එකට උඩින් පෙන්වයි.
- Static ads සහ Supabase ads දෙකේම phone fields preserve කරයි.
- React seller card එක පසුව mount වුණත් retries මගින් number එක insert කරයි.
- Logged-in dashboard mobile layout එක compact සහ balanced.
- Signup එකේ Email OTP හෝ SMS OTP තෝරාගත හැක.
- OTP request කරන විට account එක create නොවේ.
- නිවැරදි OTP verify කළ පසුව server-side account එක create කර login කරයි.

Email OTP සඳහා Vercel environment variables:
- RESEND_API_KEY
- OTP_EMAIL_FROM (example: EheMehe <no-reply@ehemehe.lk>)

SMS OTP සඳහා:
- TEXTLK_API_TOKEN
- TEXTLK_SENDER_ID

Security/server variables:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- OTP_SECRET
