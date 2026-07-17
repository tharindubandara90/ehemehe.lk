# Vercel build fix

මෙම version එකේ Vercel root project එක generic Node server එකක් ලෙස detect කිරීම නවතා ඇත.

- Frontend: `@vercel/static-build` මගින් `public/` directory එක static output ලෙස build වේ.
- APIs: `api/*.js` files වෙන වෙනම `@vercel/node` functions ලෙස build වේ.
- Root `server.js` / `index.js` entrypoint එකක් අවශ්‍ය නැහැ.
- Vercel Dashboard එකේ Framework Preset හෝ Build/Output settings වැරදිව තිබුණත් `vercel.json` හි explicit `builds` configuration එක ඒවා override කරයි.
- `npm test`: 21/21 pass.
- Local `vercel build`: pass (`Build Completed in .vercel/output`).

Deploy commands:

```bash
git add -A
git commit -m "Fix Vercel build with explicit static and API builders"
git pull --rebase origin main
git push -u origin main
```
