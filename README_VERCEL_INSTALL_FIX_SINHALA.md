# Vercel dependency-install fix

## හේතුව

Project එකේ `vercel: latest` package එක dev dependency එකක් ලෙස තිබුණා. Vercel platform එක තමන්ගේ CLI එක build environment එකේ දැනටමත් භාවිතා කරන නිසා project dependency එක ignore කරන warning එකක් දුන්නත්, npm එක එහි විශාල dependency tree එක install කිරීමට උත්සාහ කළා. Restored dependency cache එක සමඟ එම nondeterministic `npm install` එක `Exit handler never called` error එකෙන් නතර වුණා.

## කළ වෙනස්කම්

- Project dependencies වලින් `vercel` CLI එක ඉවත් කළා.
- භාවිතා නොවන `serve` package එක ඉවත් කළා.
- Node.js runtime එක `22.x` ලෙස pin කළා.
- npm metadata version එක `10.9.2` ලෙස සකස් කළා.
- Vercel install command එක `npm ci --include=dev --no-audit --no-fund` ලෙස සකස් කළා.
- `package-lock.json` අලුතින් clean ලෙස generate කළා.
- Build tools (`clean-css`, `terser`) සහ runtime image tool (`sharp`) පමණක් තබාගත්තා.
- Deployment එකට අවශ්‍ය නොවන tests, reports, SQL සහ documentation `.vercelignore` මගින් upload නොවන ලෙස සකස් කළා.

මෙම වෙනස්කම් website runtime, authentication, OTP, Post Ad, ads, admin හෝ Supabase behavior එක වෙනස් නොකරයි.
