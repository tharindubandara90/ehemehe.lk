# Vercel Function Limit Fix

Vercel Hobby deployment එකේ Serverless Functions 12 සීමාව ඉක්මවා ගියේ root `api/` directory එකේ endpoint files 17ක් තිබීම නිසාය. Root `server.js` dispatcher එක තිබුණත් Vercel විසින් `api/` යට තිබූ සෑම endpoint file එකක්ම වෙනම Function එකක් ලෙස ගණන් කළේය.

මෙම version එකේ:

- Root `api/` directory එක ඉවත් කර ඇත.
- සියලු handler modules `server-routes/` යටට මාරු කර ඇත.
- Browser භාවිතා කරන `/api/...` URLs වෙනස් කර නැත.
- `server.js` එක සියලු API requests dispatch කරන එකම Vercel Function entry point එක ලෙස තබා ඇත.
- OTP, authentication, publishing, My Ads, report, public-home, public-meta, public-ad සහ image endpoints සියල්ල ආරක්ෂා කර ඇත.
- Projected Vercel Function count එක 1කි.
