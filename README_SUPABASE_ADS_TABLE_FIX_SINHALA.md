# EheMehe.lk – Supabase `public.ads` Table Fix

## Production error එකේ root cause

Production publish API එක `/rest/v1/ads` වෙත ad එක insert කරනවා. නමුත් කලින් තිබූ `supabase_post_ad_end_to_end.sql` file එක `public.ads` table එක create කරන්නේ නැහැ. එහි තිබුණේ `alter table if exists public.ads` statements පමණයි.

`public.ads` table එක කලින් නොතිබුණොත්:

- `alter table if exists` කිසිම error එකක් නොදී skip වෙනවා.
- Local/static tests pass වෙනවා.
- Production publish වෙලාවේ PostgREST `PGRST205` / “Could not find the table 'public.ads' in the schema cache” කියලා reject කරනවා.

## දැන් කළ fix

- `supabase_marketplace_core_schema.sql` නමින් complete, idempotent database migration එකක් එක් කර ඇත.
- පැරණි `supabase_post_ad_end_to_end.sql` එකත් එම complete migration එකෙන් replace කර ඇත.
- `public.ads` table, required columns, indexes, category/city relationships, RLS policies සහ updated-at triggers create/repair කරනවා.
- SQL අවසානයේ PostgREST schema cache reload කරනවා.
- Category/City lookup tables හි row එකක් නොමැති විට slug එක UUID column එකකට දමා publish fail නොවීමට API එක නිවැරදි කර ඇත.
- Category, subcategory, district සහ city names `custom_fields` තුළ තබා public pages, My Ads සහ admin dashboard වල fallback ලෙස පෙන්වනවා.
- Table එක නැති තත්ත්වයක raw Supabase error එක userට පෙන්වීම වෙනුවට controlled database-setup error එකක් ලබාදෙනවා.

## අනිවාර්ය one-time Supabase step

Code එක GitHub/Vercel වෙත push කිරීමෙන් PostgreSQL table එක create වෙන්නේ නැහැ. පහත SQL එක Supabase SQL Editor එකේ එක් වරක් run කළ යුතුයි.

1. Supabase Dashboard එකේ EheMehe project එක open කරන්න.
2. **SQL Editor** → **New query** යන්න.
3. `supabase_marketplace_core_schema.sql` file එකේ සම්පූර්ණ content එක paste කරන්න.
4. **Run** ඔබන්න.
5. Result එකේ `ads_table = public.ads` පෙන්වන බව බලන්න.
6. Site එක reload කර Post Ad නැවත publish කරන්න.

Migration එක safe to run more than once. Existing tables/data drop කරන්නේ නැහැ.

## සත්‍ය production-test සීමාව

මෙම development environment එකෙන් ඔබගේ live Supabase SQL Editor එකට migration එක execute කළේ නැහැ. එම නිසා SQL file එක Supabase එකේ run කිරීම user-side one-time deployment step එකකි.
