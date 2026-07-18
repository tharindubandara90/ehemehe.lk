# Vercel npm install final root-cause fix

## ඇත්ත ගැටලුව

කලින් ZIP එකේ `package-lock.json` public npm registry එකෙන් නොව private build-environment registry එකකින් generate වී තිබුණා. එහි package `resolved` URLs `packages.applied-caas-gateway1.internal.api.openai.org` වෙත point කළා. Vercel build environment එකට එම private registry එක access කළ නොහැකි නිසා install process එක දිගටම බලා සිට අවසානයේ `Exit handler never called!` ලෙස npm crash වුණා.

එයට අමතරව `vercel.json` තුළ legacy `builds` property එක තිබූ නිසා project එකේ `installCommand` සහ Vercel Build & Development Settings ignore වුණා. ඒ නිසා අපි ලියා තිබූ `npm ci` වෙනුවට log එකේ පෙනෙන ලෙස `npm install` run වුණා.

## Final fix

- Legacy `builds` සහ `routes` configuration සම්පූර්ණයෙන් ඉවත් කළා.
- අමතර catch-all function/rewrites ද නොදා Vercel official root `server.js` auto-detection භාවිතා කළා.
- `server.js` Vercel runtime එකේ `server.listen()` call කරන ලෙස නිවැරදි කළා; local tests import කරන විට port එකක් open නොකරයි.
- `installCommand` deterministic `npm ci` ලෙස සකස් කළා.
- Lockfile එකේ private/environment-specific `resolved` URLs සියල්ල ඉවත් කළා. Integrity hashes තවමත් පවතින නිසා downloaded packages verify වෙනවා.
- `.npmrc` public npm registry එකට pin කළා.
- Node version Vercel Project Settings සමඟ `24.x` ලෙස align කළා.
- Vercel CLI සහ unused `serve` package project dependencies තුළ නොමැත.
