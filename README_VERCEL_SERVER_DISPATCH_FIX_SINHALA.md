# Vercel OTP API 405 Final Routing Fix

Network screenshot එකෙන් තවමත් POST /api/request-registration-otp සඳහා 405 ලැබුණු බව තහවුරු වුණා.

හේතුව:
Vercel SPA rewrite එක API POST request එක server.js වෙත යැවීමට පෙර index.html වෙත යවා තිබුණා.

Final fix:
- server.js එක Vercel Node handler එකක් ලෙස export කළා.
- Vercel හි සියලු requests server.js වෙත dispatch කරන vercel.json configuration එකක් දාලා තිබෙනවා.
- server.js මුලින් API routes handle කරලා පසුව පමණක් static pages serve කරනවා.
- Local `npm run dev` / `node server.js` භාවිතයත් තියාගෙන තිබෙනවා.
- Local integration test එකේ POST /api/request-registration-otp JSON response එකක් ලබාදුන්නා; 405 හෝ index.html ලැබුණේ නැහැ.

Deploy කළ පසුව Vercel Build Log එකේ @vercel/node server.js build එක පෙන්විය යුතුයි.
