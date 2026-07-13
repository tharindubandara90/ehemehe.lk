# ehemehe.lk Vercel Ready Project

## Local test
```bash
cd "C:\Users\Tharindu\Documents\Ehemehe\youware_to_vercel_helper\youware_to_vercel_helper"
npx serve public
```

Open:
- Home: http://localhost:3000
- Admin: http://localhost:3000/admin.html
- Browse ads: http://localhost:3000/browse.html
- Post ad: http://localhost:3000/post-ad.html

## Vercel deploy
```bash
npm install -g vercel
vercel login
vercel
vercel --prod
```

Vercel questions:
- Set up and deploy? Y
- Link to existing project? N
- Project name: ehemehe-lk
- Directory: ./
- Override settings? N

## Supabase reminder
Admin email: ehemehe.lk@gmail.com

After Vercel URL is created, add it in Supabase:
Authentication → URL Configuration → Site URL and Redirect URLs.
