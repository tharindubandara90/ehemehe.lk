# Ad Promotions + Banner Ads Update

Added:
- Admin > Ad Promotions section
- Top Ad Manager: select ad + show days + category
- Banner Ad Manager: enable/disable + image URL + target URL + show days
- Top Ads appear first in the selected category
- Banner appears only when enabled and active

Run this SQL in Supabase SQL Editor:
```text
supabase_ad_promotions_banner_schema.sql
```

Run locally:
```bash
npm install
npm run dev
```

Admin:
```text
http://localhost:3000/admin
```
