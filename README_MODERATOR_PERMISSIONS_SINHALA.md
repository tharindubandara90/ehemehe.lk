# Moderator permissions update

Admin panel > Moderators section එකෙන් දැන්:
- Moderator/Admin add කරන්න
- Active / Disable කරන්න
- Permissions edit කරන්න
- Moderator remove කරන්න

වැදගත්:
Moderator add කරන්න කලින් Supabase Authentication > Users වල email/password user එක create කරන්න.

Supabase SQL:
`supabase_admin_moderators.sql` file එක Supabase SQL Editor එකේ run කරන්න.
එතකොට `add_staff_by_email` RPC function එක create වෙනවා.

Local run:
```bash
npx serve public
```

Admin URL:
```text
http://localhost:3000/admin
```
හෝ
```text
http://localhost:3000/admin.html
```
