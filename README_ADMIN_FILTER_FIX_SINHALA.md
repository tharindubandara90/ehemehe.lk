# Admin filter fix

Fixed:
- Ad Management category filter
- Ad Management location filter
- Status + category + location combined filtering
- Parent category / subcategory matching
- District / city / location name matching
- Filter dropdown values resetting while rendering

Data sources were not changed.

Run:
```bash
npm install
npm run dev
```

Admin:
```text
http://localhost:3000/admin
```

After replacing files, use Ctrl + F5 to clear cached admin.js.
