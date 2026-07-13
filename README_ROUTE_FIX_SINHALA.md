# Ad click 404 fix

Ad card එක click කළාම `/ad/3` වගේ URL එකට යන නිසා local server එක fallback නොකරනවා නම් 404 එනවා.

මෙම ZIP එකේ:
- Vercel rewrites add කරලා තියෙනවා
- local test එකට `public/ad/1` සිට `public/ad/50` දක්වා fallback routes add කරලා තියෙනවා
- `public/404.html` fallback එකක් add කරලා තියෙනවා

Local test කරන හොඳම command එක:

```bash
npx serve public -s
```

නැත්නම් සාමාන්‍ය command එකත් බොහෝ ad demo ids වලට වැඩ කරයි:

```bash
npx serve public
```
