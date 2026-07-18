# EheMehe.lk Footer / Mobile LCP / Network Performance Fix

## පරීක්ෂා කළ ගැටලු

### 1. Footer responsive overlap

Footer එකේ සැබෑ content blocks තිබුණේ 4ක් වුවත් generated React class එක desktop එකේ columns 5ක් සහ tablet එකේ columns 4ක් සකස් කර තිබුණා. Brand/logo block එකත් එම වැරදි grid count එකට span කර තිබුණු නිසා 1024px–1147px පරාසයේ logo එක අසල්වැසි column එකට overlap විය හැකි වුණා.

නිවැරදි කිරීම:

- Mobile: columns 2
- Tablet: columns 3; brand block එක full first row
- Desktop: columns 4
- 1024px–1147px: අඩු gap එකක් සහ logo width guard එකක්
- Generated React class සහ independent structural CSS fallback දෙකම එකම 4-column structure එකට synchronize කර ඇත.

### 2. Mobile LCP අධික වීම

පරණ critical path එකේ:

- Live listing query එකෙන් විශාල Base64 `images`/`image_url` payloads download වීමේ අවදානම තිබුණා.
- Supabase live data ලැබෙනතුරු bundled sample-ad images load විය හැකි වුණා.
- පළමු listing image එක lazy load වුණා සහ fixed dimensions නොතිබුණා.
- Home data, categories, districts, cities, finance, promotions සහ banners browser එකෙන් වෙන වෙනම request වුණා.
- පළමු image එක ලබාගැනීම `home JSON → image API → Supabase → resize` ලෙස දිග network dependency chain එකකට වැටුණා.
- නව ad එක publish කරන විට dedicated lightweight thumbnail එකක් නොතිබුණා.

නිවැරදි කිරීම:

- `/api/public-home` browser critical path එකට එක request එකක් පමණක් භාවිතා කරයි.
- Ads list query එකෙන් `images` සහ `image_url` Base64 columns ඉවත් කර ඇත.
- පළමු ad thumbnail එක පමණක් server-side එකේ listing query සමඟ parallel ලෙස ගෙන, අවශ්‍ය නම් 480×360 WebP බවට පරිවර්තනය කර එම JSON response එක තුළම ලබා දෙයි.
- එමගින් පළමු card image එක සඳහා අමතර client-side Supabase/schema lookup dependency එක ඉවත් කර ඇත.
- අනෙක් images `/api/public-ad-image` හරහා 480×360 WebP quality 68 ලෙස cache කර ලබා දෙයි.
- පළමු image එක `loading="eager"`, `fetchpriority="high"`, fixed width/height සමඟ render වේ.
- අනෙක් images lazy/low-priority වේ.
- Below-the-fold cards සඳහා `content-visibility` යොදා ඇත.
- Live ads request අවසන් වීමට පෙර bundled demo images load නොවේ.
- Post Ad flow එක පළමු photo එකෙන් 480px WebP thumbnail එකක් සාදා `image_url` ලෙස save කරයි; full images detail gallery සඳහා පවතී.
- Stable card skeleton එකෙන් layout jump අවම කර ඇත.

## 3. Render-blocking සහ network dependency

පරණ critical path එකේ Google Fonts CSS import, CSS files කිහිපයක්, unminified helper JavaScript, public routes වලද SMS/Auth/Supabase scripts සහ metadata requests එකවර load විය හැකි වුණා.

නිවැරදි කිරීම:

- Google Fonts `@import` ඉවත් කර system font stack භාවිතා කරයි.
- Main CSS, runtime helper CSS සහ brand CSS එකට build කර minify කළ `ehemehe-app.min.css` එකක් පමණක් home first paint එකට load වේ.
- Public home helper Terser මගින් minify කර `index-filters.min.js` ලෙස build කරයි.
- Public home helper parser-blocking නොවන `defer` script එකක් ලෙස load වේ.
- SMS scripts login/signup/post/dashboard routes වලදී පමණක් load වේ.
- Public home එකේ Supabase client සහ external SDK `window.load`/idle පසු load වේ.
- Categories, districts, cities, finance settings, promotions සහ banners `/api/public-meta` එකෙන් deferred/background ලෙස load වේ.
- Unused unconditional Unsplash preconnect ඉවත් කර ඇත.
- Static CSS/JS සඳහා Brotli/Gzip, ETag/304 සහ content-hash immutable cache headers එක් කර ඇත.
- Public JSON endpoints සඳහා Brotli/Gzip සහ CDN cache headers එක් කර ඇත.
- Header logo 115,754 bytes PNG වෙනුවට 12,544 bytes WebP එකක් භාවිතා කරයි.
- Favicon 35,288 bytes වෙනුවට 2,087 bytes PNG එකක් භාවිතා කරයි.

## Build output sizes

- Combined CSS: 90,827 bytes raw / approximately 12,916 bytes Brotli
- Minified public home helper: 107,659 bytes raw / approximately 24,390 bytes Brotli
- Main React bundle: approximately 77,222 bytes Brotli
- Header WebP logo: 12,544 bytes
- Favicon: 2,087 bytes

## ආරක්ෂා කළ flows

- Public ad browsing without login
- Signup/Login සහ persistent session
- SMS OTP signup, password reset සහ multiple contact verification
- Category-specific Post Ad fields (main categories 13 / subcategories 62)
- District/City state
- Multiple image upload සහ publishing
- Dashboard My Ads
- Public ad details
- Search, favourites සහ report ad
- Admin functions
- Mobile සහ desktop route behavior

## පරීක්ෂණ සීමාව

Local static, API-handler, HTTP, schema සහ regression tests run කර ඇත. මෙම environment එකෙන් live Vercel deployment එකක් හෝ production PageSpeed/Lighthouse run එකක් සිදු කළේ නැහැ. Code path එක 2.5sට අඩු LCP එකක් ලබාගැනීමට අවශ්‍ය ප්‍රධාන bottlenecks ඉවත් කරන ලෙස සකස් කර ඇත; production LCP අගය deployment එකෙන් පසු PageSpeed Insights එකෙන් නැවත මැනිය යුතුය. Network, Vercel cold start, Supabase region/latency සහ production image history අනුව සැබෑ අගය වෙනස් විය හැක.

## Deployment

මෙම performance fix එක සඳහා අලුත් Supabase SQL migration එකක් අවශ්‍ය නැහැ.

```bash
git add -A
git commit -m "Fix responsive footer and optimize mobile LCP performance"
git pull --rebase origin main
git push -u origin main
```
