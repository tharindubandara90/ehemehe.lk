# Mobile Categories Removal + Auth at Publish Fix

## කරපු වෙනස්කම්

- Mobile view එකේ `Browse Categories` section/page remove/redirect කළා.
- Mobile bottom navigation එකේ Categories link hide කළා.
- Main site එකේ `/post` links `/post-ad` page එකට link කළා.
- Ad form එක login නොවී මුලින්ම සම්පූර්ණයෙන් fill කරන්න පුළුවන්.
- `Publish Ad` click කළාම user login වී නැත්නම් Login / Create Account modal එක එනවා.
- Login හෝ account creation අතරදී customer fill කළ title, price, category, city, phone, description සහ category-specific fields reset වෙන්නේ නැහැ.
- Draft එක browser localStorage තුළ save කරන නිසා modal close කළත් හෝ page එක accidental refresh වුණත් text fields restore වෙනවා.
- Selected photos login/register modal එක open කිරීමේදී page reload නොවන නිසා memory එකේම පවතිනවා.
- Login success හෝ immediate account creation success වුණාම ad එක auto-publish flow එකට continue වෙනවා.
- Email confirmation enabled නම් ad draft එක save වෙලා තියෙනවා; email confirm කර login වුණාම නැවත publish කරන්න පුළුවන්.
- Ad එක Supabase එකට successfully submit වුණාට පස්සේ විතරක් draft/data clear වෙනවා.

## Deploy

Project folder එකට files replace කරලා:

```bash
git add .
git commit -m "Require account only at ad publish and preserve draft"
git pull --rebase origin main
git push -u origin main
```
