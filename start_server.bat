@echo off
echo Starting Elite Transform Server...
echo.
echo Please keep this window open while using the website.
echo You can minimize it, but do not close it.
echo.
echo Access the site at: http://localhost:3000
echo.

:: Wait 3 seconds then open browser
start "" "http://localhost:3000"

:: Start the server
cmd /c node server.js
pause
