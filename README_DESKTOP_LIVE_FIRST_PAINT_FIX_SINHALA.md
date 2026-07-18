# Desktop live ads first-paint fix

## තිබුණු ගැටලුව

Desktop home page එක මුලින් bundled demo/static ads වලින් `Fresh recommendations` grid එක render කළා. Supabase ads සහ timed promotions load වුණාට පසු එම grid එක live data අනුව නැවත render කළා. ඒ නිසා page එක open වූ විට පළමු layout/data set එකක් පෙන්වා, තත්පරයකට පමණ පසු වෙනත් final data set එකකට මාරු වුණා.

## කළ වෙනස්කම්

- React first paint එකේ bundled recommendation cards screen එකට පෙන්වීම pre-paint guard එකකින් නතර කළා.
- Live ads/promotions requests DOMContentLoaded එකට පෙර start කරනවා.
- පළමු visit එකේ live data එනතුරු final card dimensions වල skeleton cards පමණක් පෙන්වනවා.
- සාර්ථක live ads/promotions snapshot එක localStorage තුළ පැය 6කට cache කරනවා.
- ඊළඟ page load එකේ cached live ordering එක synchronous ලෙස render කර background එකේ Supabase data refresh කරනවා.
- Network error එකක් ආවොත් අවසන් successful cache එක මකා දමන්නේ නැහැ.
- Desktop observer sync එකකදී data requests නැවත නැවත start වීම නතර කළා.

Mobile view, authentication, SMS OTP, Post Ad, publishing, Dashboard, admin සහ promotion management flows වෙනස් කළේ නැහැ.
