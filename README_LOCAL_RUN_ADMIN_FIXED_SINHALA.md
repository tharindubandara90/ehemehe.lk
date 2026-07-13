# Local admin route fixed and tested

වැදගත්: local test කරනකොට `-s` දාන්න එපා.

Run කරන්න:
```bash
npx serve public
```

ඊට පස්සේ URLs:
- http://localhost:3000/admin ✅
- http://localhost:3000/admin.html ✅ (මෙක /admin ට redirect වෙයි)
- http://localhost:3000/ad/3 ✅

හේතුව:
`npx serve public -s` දාද්දි `/admin` route එක React SPA index.html එකට fallback වෙනවා. ඒ නිසා admin page එක වෙනුවට blank/loading/404 issue එනවා.
මෙම ZIP එකේ package.json scripts ද `npx serve public` ලෙස update කරලා තියෙනවා.

Vercel production එකේ `/admin` වැඩ කරන්න vercel.json rewrite එක `/admin -> /admin.html` ලෙස තියෙනවා.
