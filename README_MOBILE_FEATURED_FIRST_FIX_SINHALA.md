# Mobile Featured Ads First Fix

Mobile site එක open කළ ගමන් `Latest Ads` custom grid එක තාවකාලිකව පෙනී පසුව `Featured Ads` section එකට මාරුවෙන flash එක fix කළා.

වෙනස්කම්:
- Mobile default home එකේ original `Featured Ads` section එක මුලින්ම පෙන්වයි.
- `Latest Ads`, `Browse Categories`, hero සහ අනවශ්‍ය sections React mount වෙන මොහොතේම hide වෙනවා.
- Supabase/network load වෙනකම් බලා නොසිට initial UI update වෙනවා.
- Custom results grid එක පෙන්වන්නේ search/location/category filter එකක් active කළාට පසුව පමණයි.
- iPhone Safari, Chrome සහ අනෙකුත් mobile browsers සඳහා cache-busting version update කළා.
