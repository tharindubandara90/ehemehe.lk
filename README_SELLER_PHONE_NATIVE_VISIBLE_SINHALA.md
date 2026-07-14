# Seller Phone Number — Native Visible Fix

කලින් fallback script එකට ad data normalize කරන විට phone number එක අහිමි වූ නිසා
number එක පෙන්වුණේ නැහැ.

මෙම update එකෙන්:
- Seller phone number එක React seller card එක තුළ native ලෙස render කරයි.
- Number එක Call Now button එකට ඉහළින් පෙන්වයි.
- Number එක tap/click කර direct call කළ හැක.
- Database/static ad normalize කිරීමේදී contactPhone සහ seller data තබා ගනී.
- React native number එක render නොවුණහොත් Call Now button එකේ tel: link එකෙන්
  number එක ගන්න fallback එකක් ඇත.
- Desktop සහ mobile දෙකම support කරයි.
