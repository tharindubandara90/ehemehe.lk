# Phone OTP Only Registration

මෙම version එකේ signup verification සඳහා SMS OTP පමණක් භාවිත වේ.

Required:
- Full Name
- Mobile Number
- Password

Optional:
- Email Address

Flow:
1. User details පුරවයි.
2. Mobile number එකට SMS OTP යවයි.
3. නිවැරදි OTP එක verify කරන තුරු account එක create නොවේ.
4. Correct OTP එකෙන් පසුව server-side account එක create වේ.
5. Phone number + password මගින් automatic login වේ.

Email OTP සහ Email OTP provider configuration අවශ්‍ය නැහැ.

Vercel environment variables:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- OTP_SECRET
- TEXTLK_API_TOKEN
- TEXTLK_SENDER_ID
