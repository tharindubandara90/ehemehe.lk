# Category fields + real image upload

මෙම update එකෙන් Post Ad flow එකට category-specific details add කරලා තියෙනවා.

Included:
- Vehicle ads: Brand, Model, Mileage, Fuel, Gear/Transmission, Engine CC, YOM/YOR, Ownership
- Property/Home/Land: Property type, bedrooms, bathrooms, land size, floor area, deed/title, utilities
- Phone: Brand, Model, Storage, RAM, Battery health, Warranty
- Electronics, Jobs, Services, Animals/Pets, Education, Fashion, Business/Industry fields
- Add Photo button දැන් demo Unsplash image එක add කරන්නේ නැහැ
- Add Photo click කළාම real file browser open වෙනවා
- Large images client-side compress වෙනවා
  - Max dimension: 1600px
  - JPEG quality: 0.88
  - Preview quality preserved while file size reduces

Supabase:
Run this SQL helper if you want to store custom fields/images:
```text
supabase_category_fields_images_schema.sql
```

Run:
```bash
npm install
npm run dev
```

Open:
```text
http://localhost:3000/post-ad
```

After replacing files, press Ctrl + F5.
