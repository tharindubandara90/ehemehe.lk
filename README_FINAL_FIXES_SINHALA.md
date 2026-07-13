# ehemehe.lk final fixed project

මෙම version එකේ ප්‍රධාන fix ටික:

1. Mobile Home එක clean ads-only layout එකක් කළා.
2. Ad එකක් open කරලා Home/back ආවම blank වෙන issue එක fix කළා.
3. Search bar එකෙන් search කළාම වෙන page එකකට නොගිහින් Home එකේම results පෙන්වන්න හැදුවා.
4. District / City / Category / Subcategory filter logic හරි කළා.
5. Grid view / List view toggle එක mobile filter row එකේ category එකට එහා පැත්තෙන් තැබුවා.
6. Ad detail page එකේ Location card සහ Report section mobile view එකේ hide කළා.
7. /ad/3 වගේ route වල 404/blank issue fix කළා.
8. Vercel rewrites update කළා.
9. index.html එකට base path fix එක දැම්මා.
10. node_modules folder එක final ZIP එකෙන් අයින් කළා.

Local test command:

```bash
cd youware_to_vercel_helper_fixed
npx serve public -s
```

Open:

```text
http://localhost:3000
```

Vercel deploy:

```bash
vercel
vercel --prod
```
