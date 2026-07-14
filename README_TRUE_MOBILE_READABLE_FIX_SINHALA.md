# True Mobile Readable Fix

මෙම update එකේ ප්‍රධාන වෙනස වන්නේ mobile browser එක desktop viewport එකක් භාවිත කළත් page එක කුඩාවට shrink වීම වැළැක්වීමයි.

- App render වීමට පෙර `<head>` තුළ mobile/touch device හඳුනාගනී.
- Viewport එක `device-width` ලෙස force කරයි.
- iPhone browser එක 980px desktop viewport එකක් තවමත් භාවිත කළහොත් scale compensation එකක් apply කරයි.
- Ad detail page එක single column, readable title/price/description sizes සහ phone-width image එකක් ලෙස පෙන්වයි.
- Header එක mobile layout එකට force කරයි.
