# Site Speed සහ Ad Loading Deep Fix

හඳුනාගත් ප්‍රධාන හේතුව image upload system එකෙන් photos Base64 text ලෙස ads table එකේම save කිරීමයි. ඒ නිසා ad list සහ ad detail requests වල JSON size ඉතා විශාල විය.

දැන්:
- අලුත් photos Supabase Storage එකට upload කර URL පමණක් database එකේ save කරයි.
- Public ad list metadata query එක image columns download නොකරයි.
- Images අවශ්‍ය වෙලාවේ පමණක් lazy binary endpoint එකෙන් load කරයි.
- පැරණි Base64 ads සඳහා compatibility proxy එක තිබේ.
- /ad/:id pages වෙනම lightweight page එකකින් load වේ. React marketplace bundle එක ad page එකේ load නොවේ.
- Home/Search scripts route-specific ලෙස පමණක් load වේ.
- Permanent MutationObserver සහ 900ms polling loops ඉවත් කර ඇත.
- My Ads API එක signed-in userගේ ads පමණක් සහ image data නැති metadata පමණක් query කරයි.

පැරණි Base64 data Storage වෙත සම්පූර්ණයෙන් migrate කිරීමට optional command:

    npm run migrate-images
