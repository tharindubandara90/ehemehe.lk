# Email + Phone Registration and OTP Controls

Implemented:
- Users can register/login using email or phone number.
- Email OTP for registration and email password reset.
- SMS OTP for phone registration and phone password reset/change.
- Ad contact phone OTP before publish.
- Admin Panel → API Settings includes master and per-purpose enable/disable switches.
- Draft ad data remains in localStorage during login/registration.

Required setup:
1. Run `supabase_auth_otp_controls.sql` in Supabase SQL Editor.
2. In Supabase Auth Email Templates, use `{{ .Token }}` in the Confirm signup / Magic Link templates so the email contains an OTP code instead of only a link.
3. Add Vercel environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TEXTLK_API_TOKEN`, `TEXTLK_SENDER_ID`, `OTP_SECRET`.
4. Never expose the service-role key in browser JavaScript. It is used only by serverless API files.
