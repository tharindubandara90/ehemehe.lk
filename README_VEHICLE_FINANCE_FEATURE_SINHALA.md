# Vehicle Finance Feature

Added:
- Admin panel Vehicle Finance Settings
- Down Payment %, Annual Rate %, Months, Finance Company Phone
- User Post Ad page vehicle price auto calculation
- Admin Ad Management vehicle finance preview
- Public vehicle ad cards show finance line under price
- Settings saved to Supabase `site_settings` when available and localStorage fallback

Run optional SQL:
`supabase_vehicle_finance_settings.sql`

Run locally:
```bash
npm install
npm run dev
```

Admin:
```text
http://localhost:3000/admin
```

Post Ad:
```text
http://localhost:3000/post-ad.html
```
