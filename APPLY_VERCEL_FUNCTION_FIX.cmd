@echo off
setlocal
cd /d "%~dp0"
echo.
echo EheMehe.lk - removing old Vercel API function files...
node scripts\cleanup-legacy-vercel-api.js
if errorlevel 1 (
  echo Cleanup failed. Make sure Node.js is installed and this file is inside the project root.
  pause
  exit /b 1
)
echo.
echo Cleanup complete.
echo Now run:
echo   git add -A
echo   git commit -m "Remove stale Vercel API functions and enforce single server deployment"
echo   git pull --rebase origin main
echo   git push -u origin main
echo.
pause
