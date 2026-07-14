# Mobile Browser Final Fix

Fixes:
- iPhone Safari/Chrome/Firefox වල hero promotional section mobile එකේ hide කරයි.
- Mobile එකෙන් search/filter bar පසුව ads list එකට direct යයි.
- Header logo crop කරලා compact size එකට fix කළා.
- පරණ malformed favicon text (`e">`, SVG tail) remove කළා.
- Horizontal overflow සහ giant blank spacing prevent කළා.
- Cache bust version `20260714-mobile-final` add කළා.

Deploy:
```bash
git add .
git commit -m "Fix mobile header and hide hero on all browsers"
git pull --rebase origin main
git push -u origin main
```
