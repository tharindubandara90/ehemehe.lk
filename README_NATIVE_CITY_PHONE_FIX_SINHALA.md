# Contact & Location Native React Fix

මෙවර City field සහ SMS verification controls පිටතින් DOM එකට inject කරන්නේ නැහැ.
ඒවා React Post Ad component එක ඇතුළටම දාලා තිබෙන නිසා React re-render වුණත් අයින් වෙන්නේ නැහැ.

දැන්:
- District එකට යටින් City / Town dropdown එක පෙන්වයි.
- District වෙනස් කළොත් City selection එක reset වේ.
- Phone number එක ඉදිරියේ Verify button එක පෙන්වයි.
- OTP යැවීම, Confirm OTP සහ Resend ක්‍රියා කරයි.
- Phone numbers 1 සිට 5 දක්වා add කළ හැක.
- සියලු numbers verify නොකර Continue කළ නොහැක.
- District, City සහ verified phone numbers තුනම අනිවාර්යයි.
