# Admin login Failed to fetch fix

Fixed:
- Supabase login `Failed to fetch` error එකට try/catch add කළා.
- Error message professional/clear කළා.
- localhost development එකේ `ehemehe.lk@gmail.com` main admin account එකට Supabase network fail වුණත් dashboard test කරන්න local Super Admin fallback එකක් add කළා.
- Production/Vercel වල fallback එක වැඩ නොකරයි; ඒකට Supabase Auth required.

Run:
```bash
npm install
npm run dev
```

Admin:
```text
http://localhost:3000/admin
```

After replacing files, press Ctrl + F5.
