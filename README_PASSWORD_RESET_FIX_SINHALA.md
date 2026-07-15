# Secure SMS Password Reset

දැන් Password Reset flow එක:

1. Registered mobile number එක ඇතුළත් කරන්න.
2. SMS OTP එක යවන්න.
3. 6-digit OTP එක verify කරන්න.
4. OTP verify වූ පසුව පමණක් New Password සහ Confirm Password fields පෙන්වයි.
5. Password update කළ පසුව automatic login නොවේ. Login screen එකට ආපසු එයි.

Backend එකේ valid password_reset_phone OTP token එකක් නැතිව password update කළ නොහැක.
