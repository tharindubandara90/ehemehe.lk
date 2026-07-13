# /ad/3 blank page fix

මෙම ZIP එකේ `/ad/3` වගේ route එකේ blank/404 issue එක fix කරලා තියෙනවා.

වැදගත්ම fix එක:
- `index.html` එකට `<base href="/">` add කරලා තියෙනවා.
- ඒ නිසා `/ad/3` route එකේදී `supabase.js`, `index-filters.js`, `js/index...`, `css/index...` වැරදි path එකෙන් load වෙන්නේ නැහැ.
- Vercel rewrites update කරලා තියෙනවා.
- local test එකට `/public/ad/1` සිට `/public/ad/100` දක්වා fallback add කරලා තියෙනවා.

Local test:
```bash
npx serve public -s
```

Server restart කරලා browser hard refresh කරන්න.
