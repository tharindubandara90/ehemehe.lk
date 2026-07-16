# Post Ad Category Details – Root Cause Fix

මෙම update එකේදී `Review` step එක වෙනස් කිරීම පමණක් නොව, ඊට කලින් තිබෙන `Ad Details` step එකේ අතුරුදහන් වූ category-specific fields නැවත නිවැරදි කර ඇත.

## ඇත්ත root cause එක

Category fields React component එකෙන්ම render කර තිබුණේ නැහැ. `post-ad-category-fields.js` helper එක DOM එකට පසුව inject කළා. Category/Subcategory values `setTimeout` එකකින් පසුව read කළ නිසා React එක Category step එක unmount කළොත් helper state එක හිස්වී `injectDetailsFields()` සම්පූර්ණයෙන් return වුණා. එම නිසා Cars සඳහා Model/Mileage පමණක් නොව සියලු category details block එකම නොපෙනී ගියා.


## හඳුනාගත් competing implementation එක

Project එක ඇතුළේ Post Ad implementations දෙකක් තිබුණා:

- React five-step `/post` flow — දැනට භාවිතා කළ යුතු ප්‍රධාන flow එක.
- පැරණි standalone `/post-ad.html` + `post-ad.js` flow — generic category fields සහ වෙනම publish/auth logic තිබූ legacy flow එක.

`brand-theme.js` එක `/post` links පැරණි `/post-ad` route එකට මාරු කරමින් තිබූ නිසා, user ගිය navigation path එක අනුව වෙනස් Post Ad forms දෙකක් ලැබිය හැකිව තිබුණා. දැන් `/post` එක එකම canonical flow එකයි. පැරණි `/post-ad` සහ `/post-ad.html` URLs query parameters ආරක්ෂා කරමින් `/post` වෙත redirect වේ. Admin quick link එකත් `/post` වෙත යාවත්කාලීන කළා.

## කළ වෙනස්කම්

- Category/Subcategory values React step එක මාරු වීමට පෙර synchronously save කරයි.
- Supabase UUID values ලැබෙන select implementation එකක් වුවත් selected option name එකෙන් නිවැරදි category/subcategory slug එක resolve කරන compatibility layer එක ආරක්ෂා කර වැඩිදියුණු කළා.
- Session storage සහ local storage දෙකේම කුඩා selection snapshot එකක් තබයි.
- React bundle එකේ Category, Subcategory සහ Details step සඳහා stable data markers එක් කළා.
- Details step එකේ React-owned `ehm-category-fields-host` එකක් එක් කළා.
- Permanent polling loop එකක් නැවත එක් කළේ නැහැ; step change වෙලාවට පමණක් bounded retries 4ක් භාවිතා කරයි.
- සියලු main categories 13 සහ current subcategories 62ට අදාළ fields matrix එක පරීක්ෂා කර වැඩිදියුණු කළා.
- Existing photo upload, OTP, District/City, publish, My Ads, public browsing සහ admin flows වෙනස් කළේ නැහැ.

## Local validation

```bash
node post_ad_all_category_fields_test.js
node category_taxonomy_uuid_regression_test.js
node post_ad_category_location_test.js
node post_ad_route_cache_regression_test.js
node post_ad_canonical_route_test.js
npm run build
```

Live production Vercel/Supabase/Text.lk environment එක මෙහිදී වෙනස් හෝ test කර නැහැ.
