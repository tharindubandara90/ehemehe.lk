# Admin site data sync fix

මෙම update එකෙන් public site එකේ පෙනෙන static/demo ads admin dashboard එකටත් load වෙනවා.

Fixed:
- Public site shows 16 ads but admin showed 0 issue fixed.
- Admin dashboard now merges Supabase ads + site static ads.
- If Supabase ads table is empty, admin still shows the 16 ads shown on the site.
- Ad Management default filter is now All statuses.
- Static site ads edited from admin are stored in localStorage and reflected on public page in the same browser.
- Supabase database ads still use normal approve/reject/edit/delete logic.

Important:
- For production/server-wide editing, ads should be stored in Supabase. Static file data cannot be permanently changed on the server from a browser-only admin panel.
- This fix makes the current local/site data visible and manageable in local dashboard.

Run:
```bash
npm install
npm run dev
```

Admin:
```text
http://localhost:3000/admin
```

Validation:
`ADMIN_SITE_DATA_SYNC_VALIDATION.json`
