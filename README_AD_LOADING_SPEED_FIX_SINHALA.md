# Ad Loading සහ Site Speed Fix

- Ad detail page එක open කරන විට full ads table එක නැවත download කරන්නේ නැහැ.
- Supabase categories/cities embedded join query එක ඉවත් කර ඇත.
- List pages සඳහා අවශ්‍ය columns පමණක් load කර rows 120කට limit කර ඇත.
- Slow request සඳහා timeout සහ fallback එකක් ඇත.
- Ad page එකේ 200ms polling loop එක ඉවත් කර ඇත.
