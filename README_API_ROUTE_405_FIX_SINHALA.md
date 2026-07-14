# OTP API 405 Fix

Browser Network screenshot එකෙන් තහවුරු වූ වැරැද්ද:

POST /api/request-registration-otp
Status: 405 Method Not Allowed
Response: public/index.html

Project එක Vercel හි server.js root entrypoint ලෙස run වෙනවා. නමුත් server.js තුළ
request-registration-otp සහ verify-registration-otp API routes add කරලා තිබුණේ නැහැ.
ඒ නිසා API POST request එක index.html static fallback එකට ගියා.

මෙම version එකෙන්:

- /api/request-registration-otp server.js route එකට සම්බන්ධ කළා.
- /api/verify-registration-otp server.js route එකට සම්බන්ධ කළා.
- /api/register-verified-user route එකත් සම්බන්ධ කළා.
- Unknown API paths JSON 404 response එකක් ලබාදෙනවා.
- POST request එකක් static index.html එකට වැටෙන්නේ නැහැ.
- Frontend එක empty/non-JSON response එකක් ලැබුණත් නිවැරදි HTTP error එක පෙන්වනවා.
- Vercel rewrites වල API routes SPA catch-all එකට කලින් තැබුවා.
