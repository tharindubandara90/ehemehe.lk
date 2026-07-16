# EheMehe Unified SMS Verification Fix

මෙම version එකේ SMS OTP client implementation කිහිපයක් වෙනුවට එකම `public/sms-verification-service.js` service එක භාවිත වේ.

හදපු flows:
- Signup SMS OTP සහ OTP verify කළ පසු account creation
- Password reset SMS OTP, OTP verification සහ new password update
- Post Ad contact phone verification
- Contact phone numbers 1 සිට 5 දක්වා verification
- OTP resend සහ verified-token restore
- පරණ cached pages සඳහා `EHM_OTP` compatibility alias/loader

Preserved:
- District -> City/Town list (Kandy -> Gampola ඇතුළුව)
- Login/Signup නොවී ad post කිරීමට නොහැකි වීම
- Login නොවී public ads බැලිය හැකි වීම
- Admin panel SMS OTP enable/disable controls
- Existing Text.lk සහ Supabase server-side security

Deploy කළ පසු new versioned assets භාවිත වන නිසා පරණ OTP client cache එක නැවත භාවිත නොවේ.
