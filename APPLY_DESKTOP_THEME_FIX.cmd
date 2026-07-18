@echo off
setlocal
cd /d "%~dp0"
echo.
echo EheMehe.lk - removing stale desktop demos and deployment outputs...
call npm run cleanup:deployment
if errorlevel 1 goto :error

echo.
echo Building the exact compact desktop marketplace requested by the owner...
call npm run build
if errorlevel 1 goto :error

echo.
echo Running all connected regression checks...
call npm test
if errorlevel 1 goto :error

echo.
echo SUCCESS: Exact compact desktop home with live Latest Ads is ready.
echo Now run the Git commands shown by ChatGPT.
pause
exit /b 0

:error
echo.
echo FAILED. Do not push this project yet.
pause
exit /b 1
