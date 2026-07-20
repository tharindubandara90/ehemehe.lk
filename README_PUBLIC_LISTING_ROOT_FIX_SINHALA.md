# Public Listing Root Fix

මෙම build එකේ Home latest ads, `/search` All Ads, `/category/:slug`, direct `/ad/:uuid`, live Supabase fallback, status/schema compatibility සහ category UUID mapping එක එකම live data pipeline එකකට සම්බන්ධ කර ඇත.

- Pending, rejected, draft සහ blocked ads public pages වල නොපෙන්වයි.
- Approved, Active, Published, Live සහ legacy status-empty approved rows support කරයි.
- `created_at` හෝ optional columns schema cache එකේ නොතිබුණත් fallback query එකෙන් ads load කරයි.
- `/search` page එක bundled demo/static array එක නොව live approved listings render කරයි.
- Public API එක empty response දුන්නොත් browser Supabase client එකෙන් එක් වරක් verify කරයි.
- Direct UUID ad route එක stale cache නොගෙන fresh detail load කරයි.
