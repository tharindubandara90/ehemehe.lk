# OTP Gate Root Cause Fix

හඳුනාගත් ප්‍රධාන වැරදි:

1. Original React signup page එක OTP භාවිත නොකර second 1කට පස්සේ local fake user කෙනෙක් login කළා.
2. Home page එකෙන් SPA navigation කළාම secure signup UI එක වෙනුවට original fake signup page එක open වුණා.
3. Post Ad modal එකේ වෙනම පරණ registration flow එකක් තිබුණා. SMS OTP setting එක disabled වුණොත් OTP නැතිව account create කළ හැකි වුණා.
4. Text.lk API එක HTTP 200 සමඟ status:error එව්වත් code එක message field එක තිබීම නිසා success ලෙස ගත්තා.

Fix:

- /login සහ /signup routes වල original React bundle එක load නොවේ.
- Auth links hard page navigation භාවිත කරයි.
- Fake original login/signup handlers disable කළා.
- Post Ad registration secure /signup SMS OTP page එකට යවයි; draft එක localStorage තුළ තබාගනී.
- Legacy registration APIs වල OTP token එක අනිවාර්ය කළා.
- OTP request කරන අවස්ථාවේ account create නොවේ.
- Wrong OTP එකෙන් account create නොවේ.
- Correct OTP verify කළ පසුව පමණක් Supabase account එක create වේ.
- Text.lk status:error දැන් customerට නිවැරදි error එකක් ලෙස පෙන්වයි.
- Real Supabase session එක React dashboard UI එකට sync කරයි.

Vercel Environment Variables අනිවාර්යයි:

- TEXTLK_API_TOKEN
- TEXTLK_SENDER_ID
- OTP_SECRET
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

Text.lk sender ID එක account එකේ approved sender ID එකක් විය යුතු අතර characters 11කට වැඩි නොවිය යුතුය.
