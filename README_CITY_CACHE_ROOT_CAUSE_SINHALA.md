# District / City root-cause fix

මෙම update එකෙන් React bundle එකේ තිබූ අලුත් City/Town implementation එක browser cache එක නිසා නොපෙනීම සහ Home සිට SPA navigation එකෙන් Post Ad වෙත ගිය විට category/location helper start නොවීම නිවැරදි කර ඇත.

- Local JS/CSS files සඳහා content-hash version URLs භාවිතා කරයි.
- Content hash නොවන reused version labels සඳහා year-long immutable cache නොදේ.
- Post Ad helper එක current route එක dynamic ලෙස පරීක්ෂා කරයි.
- අනවශ්‍ය 900 ms polling loops ඉවත් කර MutationObserver එක Post Ad සහ Dashboard routes වලට පමණක් සීමා කර ඇත.
- Deploy කිරීමට පෙර `npm run prepare-assets` ධාවනය කළ හැක.
