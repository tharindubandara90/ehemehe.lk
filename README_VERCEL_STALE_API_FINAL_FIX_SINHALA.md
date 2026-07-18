# Vercel Hobby Function Limit - අවසාන Root Cause Fix

## ඇත්ත හේතුව

අලුත් project ZIP එකේ root `api` directory එක ඉවත් කර තිබුණත්, Windows File Explorer එකෙන් අලුත් files පරණ Git project folder එකට copy කර `Replace` කළ විට අලුත් ZIP එකේ නොමැති පරණ folders delete නොවේ.

එනිසා Git repository එකේ පරණ `api/*.js` files 18 තවම පැවතුණා. Vercel ඒවා වෙන වෙනම Serverless Functions ලෙස ගණන් කළ නිසා Hobby limit error එක නැවතත් ආවා.

## මේ build එකේ ආරක්ෂාව

1. `.vercelignore` මගින් root `api`, `app/api`, `pages/api`, සහ `src/api` paths deployment upload එකෙන් exclude කරයි.
2. `npm run cleanup:vercel-functions` මගින් පරණ API directories physically delete කරයි.
3. `server.js` එක පමණක් Vercel server entry එක වේ.
4. සියලු endpoint modules `server-routes/` යට internal dependencies ලෙස පවතී.

## Copy කිරීමෙන් පසු අනිවාර්ය command

```bash
git rm -r -f --ignore-unmatch api app/api pages/api src/api
npm run cleanup:vercel-functions
git add -A
git commit -m "Remove stale Vercel API functions and enforce single server deployment"
git pull --rebase origin main
git push -u origin main
```

`git rm` command එක තමයි පරණ Git-tracked API files වල deletion commit එකට ඇතුළත් කරන්නේ.
