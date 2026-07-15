# Post Ad Category and Location Fix

හඳුනාගත් ප්‍රධාන වැරැද්ද:
පරණ code එක Category/Subcategory dropdown දෙක පමණක් බලන්නේ නැතිව page එකේ සියලු dropdown values scan කළා.
ඒ නිසා Condition = New, Gender, Property Type, Body Type වැනි selections category එකක් ලෙස වැරදිව හඳුනාගෙන
Vehicle ad එකකට Animals & Pets හෝ Property fields පෙන්විය හැකි වුණා.

දැන්:
- Category සහ Subcategory controls දෙකෙන් පමණක් category state එක තීරණය කරයි.
- Vehicle body type selected vehicle subcategory එක අනුව පමණක් වෙනස් වේ.
- Property > Land සඳහා Bedrooms/Bathrooms හෝ New/Used පෙන්වන්නේ නැහැ.
- Property, Jobs, Services, live Animals, Tuition/Courses සහ සෞඛ්‍ය products සඳහා Condition අයින් කර ඇත.
- District select කළ පසු එයට අදාළ City/Town dropdown එක පෙන්වයි.
- District සහ City දෙකම select නොකර Contact step එකෙන් ඉදිරියට යා නොහැක.
- Required Category Details පුරවන්නේ නැතිව Continue කළ නොහැක.
