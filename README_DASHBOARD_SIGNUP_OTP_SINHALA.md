# Dashboard + Signup OTP Update

මෙම update එකෙන්:

1. User dashboard mobile view එක compact සහ balanced layout එකකට සකස් කළා.
2. Signup form එකේ Full Name, Email, Mobile Number සහ Password ලබාගන්නවා.
3. Userට Email OTP හෝ SMS OTP verification method එක තෝරාගන්න පුළුවන්.
4. OTP verify නොකර account එකට login/redirect වෙන්නේ නැහැ.
5. SMS method එකේ actual account එක server-side verified token එක validate කළ පසුව පමණක් create වෙනවා.
6. Email method එකේ email OTP verify කළ පසුව පමණක් account එක active/session එක ලැබෙනවා.
7. Seller phone number එක Call Now button එකට උඩින් පෙන්වනවා.

Required Vercel environment variables:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- TEXTLK_API_TOKEN
- TEXTLK_SENDER_ID
- OTP_SECRET

Supabase email OTP template එකේ {{ .Token }} තිබිය යුතුයි.
