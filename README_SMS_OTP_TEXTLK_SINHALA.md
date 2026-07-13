# Text.lk SMS OTP Gateway

මෙම update එකෙන් Text.lk SMS gateway එක OTP verification සඳහා add කරලා තියෙනවා.

Included:
- Register කරන විට phone OTP verification
- Post Ad කරන විට ad phone number OTP verification
- OTP verify කළාට පස්සේ විතරයි registration / submit continue වෙන්නේ
- Admin → API Settings → Text.lk SMS / OTP Gateway settings
- Admin test OTP button
- Secure backend API routes
  - /api/request-otp
  - /api/verify-otp
- Local Node server with API support
- Vercel API function support
- Supabase SQL helper: supabase_sms_otp_schema.sql

Important security:
- Text.lk API token frontend JS files වලට දාන්න එපා.
- Token එක .env.local හෝ Vercel Environment Variables වලට විතරක් දාන්න.
- Screenshot එකක token share වෙලා තියෙන නිසා Text.lk dashboard එකෙන් token regenerate කරන එක safe.

Local setup:
1. `.env.example` copy කරලා `.env.local` කියලා rename කරන්න.
2. `.env.local` ඇතුළේ values දාන්න:

```env
TEXTLK_API_TOKEN=your_textlk_token
TEXTLK_SENDER_ID=EHEMEHE
OTP_SECRET=long_random_secret
OTP_EXPIRY_MINUTES=5
```

3. Run:

```bash
npm install
npm run dev
```

4. Open:

```text
http://localhost:3000/admin
http://localhost:3000/post-ad.html
```

Supabase:
- `supabase_sms_otp_schema.sql` file එකේ SQL code එක Supabase SQL Editor එකට paste කරලා run කරන්න.
- OTP logs save කරන්න අවශ්‍ය නම් `.env.local` එකට `SUPABASE_SERVICE_ROLE_KEY` දාන්න. ඒ key එක frontend එකට දාන්න එපා.

Vercel:
- Project → Settings → Environment Variables:
  - TEXTLK_API_TOKEN
  - TEXTLK_SENDER_ID
  - OTP_SECRET
  - OTP_EXPIRY_MINUTES
  - SUPABASE_URL optional
  - SUPABASE_SERVICE_ROLE_KEY optional

Text.lk API:
- POST endpoint: https://app.text.lk/api/v3/sms/send
- Authorization: Bearer token
