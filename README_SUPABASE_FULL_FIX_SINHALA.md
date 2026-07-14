# Supabase Full Connection Fix

Project එකේ Supabase URL සහ anon key එක එකිනෙකට නොගැලපීම නිසා connection එක fail වෙලා තිබුණා.
Anon key එකට අදාළ නිවැරදි project URL එක දැන් `https://ieymsjeywkapqeniirlm.supabase.co` ලෙස set කර ඇත.

Fix කළ දේ:
- URL / anon key mismatch ඉවත් කළා.
- `window.supabaseClient` එක site සහ admin දෙකටම එකම විදිහට create වෙනවා.
- Admin login client එක ready වෙනකම් wait කරනවා.
- සියලු HTML files වල Supabase script path/load order නිවැරදි කළා.
- Admin duplicate files සහ ad route shells sync කළා.
- Server OTP code එකට public Supabase URL fallback එකක් දැම්මා.
- JS syntax සහ local routes test කළා.

වැදගත්: Phone account creation/password reset සඳහා Vercel Environment Variables තුළ `SUPABASE_SERVICE_ROLE_KEY` තිබිය යුතුය. Service role key එක frontend files වලට දාලා නැහැ.
