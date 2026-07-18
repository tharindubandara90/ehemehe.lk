@echo off
setlocal
cd /d "%~dp0"
echo.
echo EheMehe.lk - removing stale deployment outputs...
call npm run cleanup:deployment
if errorlevel 1 goto :error

echo.
echo Rebuilding the OLX-style desktop marketplace...
call npm run build
if errorlevel 1 goto :error

echo.
echo Checking project files...
call npm test
if errorlevel 1 goto :error

echo.
echo SUCCESS: OLX-style desktop marketplace is ready.
echo Now run the Git commands shown by ChatGPT.
pause
exit /b 0

:error
echo.
echo FAILED. Do not push this project yet.
pause
exit /b 1
