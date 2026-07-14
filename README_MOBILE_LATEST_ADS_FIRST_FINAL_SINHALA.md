# Mobile Latest Ads First — Final Fix

Mobile site එක open කළ ගමන් පෙන්විය යුතු layout එක:

- `Latest Ads`
- `Recently added listings`
- ads දෙක බැගින් පෙන්වන two-column grid
- Location / Category / view buttons
- Featured Ads horizontal carousel එක පෙන්වන්නේ නැහැ

Fix එකේ ක්‍රියාකාරීත්වය:
- Supabase data load වෙනකම් බලා නොසිට bundled ads වලින් Latest Ads grid එක මුලින්ම render කරනවා.
- Live Supabase ads load වුණාට පස්සේ ඒ grid එකම refresh කරනවා.
- React විසින් පසුව mount කරන Featured Ads සහ වෙනත් original sections තාවකාලිකව පෙන්වීම වැළැක්වෙනවා.
- iPhone Safari/Chrome cache සඳහා script version update කළා.
