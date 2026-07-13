# Admin route fix

Test URLs:
- http://localhost:3000/admin/index.html
- http://localhost:3000/admin.html
- http://localhost:3000/admin

මෙම version එකේ:
1. public/admin/index.html add කරලා තියෙනවා.
2. /admin route එක SPA index එකට ගියත් automatically /admin/index.html වෙත redirect වෙනවා.
3. admin page එකේ supabase.js/admin.js paths absolute කරලා තියෙනවා.
4. Vercel rewrites update කරලා තියෙනවා.

Run:
```bash
npx serve public -s
```
