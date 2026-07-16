# Post Ad Review / Publish State Fix

## ගැටලුව

Review step එකේ Title, Description, Price සහ Category Details නිවැරදිව පෙන්වූවත් `Post Ad` බොත්තම ඔබන විට:

`Complete the title, description and price.`

යන error එක පෙන්විය හැකිව තිබුණා.

## Root cause

React Post Ad form එක Title, Description, Price, Condition, Category සහ Email values component state එක තුළ තබාගෙන Review step එකේ text cards ලෙස පෙන්වයි.

එහෙත් `post-ad-runtime.js` publisher එක publish වෙලාවේ Review card values හෝ preserved state භාවිතා නොකර, `Ad Details` සහ `Contact & Location` steps වල තිබූ input/select elements නැවත DOM එකෙන් සෙවීය. Review step එකට පැමිණෙන විට එම steps React විසින් unmount කර ඇති නිසා controls හමු නොවී හිස් strings ලැබුණා.

එම implementation එකෙන් පහත data ද අහිමි විය හැකිව තිබුණා:

- Title
- Description
- Price
- Condition
- Category ID / name
- Subcategory ID / name
- Optional contact email

## සිදු කළ fix

- `ehemehe:reactPostDraft:v1` session draft snapshot එක එක් කළා.
- Category step එකෙන් ඉවත්වීමට පෙර Category/Subcategory ID සහ display name capture කරනවා.
- Details step එකෙන් ඉවත්වීමට පෙර Title, Description, category-specific Price label සහ Condition capture කරනවා.
- Contact step එකෙන් ඉවත්වීමට පෙර optional Email capture කරනවා.
- Review publish වෙලාවේ live inputs නොමැති නම් preserved snapshot එක භාවිතා කරනවා.
- පැරණි/stale session snapshot එකක් නොමැති අවස්ථාවක Review cards වලින් Title, Description, Price සහ Condition ලබාගන්න fallback එකක් එක් කළා.
- District/City සඳහා තිබූ native location snapshot එකම භාවිතා කරනවා.
- Successful publish එකකින් පසු draft snapshot එක ඉවත් කරනවා.
- Category-specific custom fields, SMS OTP proof, images සහ Dashboard My Ads flow වෙනස් නොකළා.
- Runtime asset content hash එක අලුත් කර browser/Vercel immutable cache එකෙන් පැරණි JS file එක ලැබීම වැළැක්වුවා.

## Regression checks

- Review step publish state test
- Category/Subcategory preserved state
- Title/Description/Price preserved state
- Review-card fallback state
- Optional Email preserved state
- District/City preserved state
- 13 main categories / 62 subcategories field schemas
- Multi-phone OTP
- Signup / login / password reset OTP
- Admin dashboard actions
- Canonical Post Ad route
- Asset hash/cache validation
