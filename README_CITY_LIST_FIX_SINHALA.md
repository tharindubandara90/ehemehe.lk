# District → City Final Fix

Root cause එක React City dropdown එක පසුව load වෙන helper object එකකින් city data ගත්ත එකයි. සමහර browser/WebView load වලදී React component එක මුලින් render වී helper එක පසුව load වුණ නිසා `Other / Not listed` විතරක් ඉතිරි වුණා.

දැන් city map එක production React bundle එක තුළම තියෙනවා. එම නිසා load order, cache හෝ WebView timing එකෙන් city list එක නැති වෙන්නේ නැහැ.

- District 25ම ඇතුළත්.
- Kandy select කළාම Kandy, Peradeniya, Katugastota, Gampola, Nawalapitiya, Kundasale, Digana සහ අනෙකුත් towns පෙන්වයි.
- `Kandy`, `Kandy District`, uppercase/lowercase සහ extra spaces එකම district එක ලෙස හඳුනාගනී.
- OTP, login/signup requirement, photo upload, dashboard, ad publishing සහ performance files වෙනස් කර නැහැ.
- Node regression test සහ headless Chromium React UI test දෙකම pass කර ඇත.
