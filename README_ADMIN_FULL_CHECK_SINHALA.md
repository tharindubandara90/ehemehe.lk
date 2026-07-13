# Admin Full Link + Data Validation

මෙම ZIP එකේ admin panel එකේ සියලුම sidebar options, button handlers, section links, filters සහ data rendering logic check කරලා තියෙනවා.

Fixes:
- Category / Location filters render වෙද්දී reset වෙන bug එක fix කරලා තියෙනවා.
- Supabase select එක pagination support කරන විදිහට update කරලා තියෙනවා. එනිසා site/database එකේ ads 10ක් තිබුණොත් dashboard එකට 10ම load වෙනවා.
- Reports/Shops/Verification/Pricing/Banners fallback tables link වෙද්දී update/delete action wrong table එකට යන issue fix කරලා තියෙනවා.
- package.json එකට serve dependency add කරලා තියෙනවා.

Validation:
- JS syntax check
- Sidebar tab -> section link check
- onclick/oninput/onchange functions check
- DOM id references check
- Mock Supabase data test:
  - 10 approved ads
  - 2 pending ads
  - 12 total ads in management list
  - all 17 tabs opened
  - approve/reject/delete actions tested

See:
`ADMIN_FULL_LINK_DATA_VALIDATION.json`

Run:
```bash
npm install
npm run dev
```

Admin:
```text
http://localhost:3000/admin
```
