# Desktop Home First-Paint Fix

## Root cause

Desktop home helper එක Hero controls වෙනස් කිරීමට පෙර Supabase lookups, finance settings, ads සහ promotions queries හතරම අවසන් වනතුරු බලාගෙන තිබුණා. ඒ අතර React native Hero layout එක පළමුව පෙන්වා, seconds කිහිපයකට පසු helper layout එක inject කළා. Desktop home route එක MutationObserver එකෙන් ආරක්ෂා කර නොතිබූ නිසා auth/data hydration re-render එකකදී native layout එක නැවත පෙන්විය හැකිව තිබුණා.

## Fix

- React mount වීමට පෙර desktop-home pre-paint watcher එක install කළා.
- Native Hero location wrapper එක first paint එකේම hide කළා.
- Hero entrance opacity/slide animation desktop home සඳහා disable කළා.
- Final Category/Location bar එක Supabase requests වලට පෙර fallback data වලින් render කරනවා.
- Lookups, finance, ads සහ promotions requests parallel background load කරනවා.
- Desktop home route එක main MutationObserver lifecycle එකට එක් කළා.
- React hydration re-render එකකින් old Hero layout එක නැවත පැමිණියොත් lightweight shell එක synchronous ලෙස restore කරනවා.
- පරණ 500ms සහ 1400ms delayed rewrites ඉවත් කළා.
