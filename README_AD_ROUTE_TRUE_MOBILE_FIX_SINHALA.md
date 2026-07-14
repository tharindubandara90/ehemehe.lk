# Ad Detail Mobile View — Root Cause Fix

අවුල CSS එක පමණක් නොවේ. `public/ad/1/index.html` සිට `public/ad/100/index.html`
දක්වා පරණ static HTML files තිබුණා. Vercel එක `/ad/:id` request එකට SPA rewrite එක
භාවිත කිරීමට පෙර ඒ පරණ file එක serve කළ නිසා නව mobile CSS/JS load වුණේ නැහැ.

මෙම update එකෙන්:

- සියලු static ad route HTML files, අලුත් responsive `public/index.html` shell එකට sync කළා.
- Mobile viewport fix, green theme, new logo සහ mobile scripts දැන් සෑම ad page එකකම load වෙනවා.
- `.vercelignore` තුළ `public/ad/**` දාලා Vercel static files rewrite එක shadow කිරීම වැළැක්වුවා.
- අනාගතයේ root index එක වෙනස් කළාම `npm run sync-ad-shells` run කරලා සියලු ad routes update කළ හැක.
