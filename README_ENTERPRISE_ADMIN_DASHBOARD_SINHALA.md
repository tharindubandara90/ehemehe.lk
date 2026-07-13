# Enterprise Admin Dashboard Update

මෙම version එකේ admin dashboard එක user requested module structure එකට rebuild කරලා තියෙනවා.

Included modules:
1. Overview dashboard analytics
2. Ad & Listing Management
3. Category / Subcategory Management
4. Promotions Manager
5. Reported Ads
6. User Management
7. Shops / Business Profiles
8. User Verification
9. Payment Logs
10. Pricing & Subscriptions
11. Invoices
12. Location / Region Settings
13. Custom Fields
14. Role-Based Access Control
15. SEO Manager
16. API Settings
17. Banner Ads

UI wording:
- Admin interface එක professional English wording වලින් පමණයි.
- Sinhala explanatory blocks admin UI එකෙන් remove කරලා තියෙනවා.

Database:
- Existing Supabase tables load වෙනවා.
- Optional modules වල tables නැත්නම් dashboard එක crash වෙන්නේ නැහැ.
- Optional tables create කරන්න `supabase_admin_enterprise_schema.sql` Supabase SQL Editor එකේ run කරන්න.

Local run:
```bash
npm install
npm run dev
```
or:
```bash
npx serve public
```

Admin:
```text
http://localhost:3000/admin
```

Validation:
- JS syntax checked
- Admin routes checked
- Required admin sections checked
- Sinhala UI text scan checked
See `ADMIN_DASHBOARD_VALIDATION.json`.
