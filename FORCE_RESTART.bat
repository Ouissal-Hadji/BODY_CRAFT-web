@echo off
echo.
echo ===========================================
echo   FORCE RESTART - ELITE TRANSFORM SERVER
echo ===========================================
echo.
echo 1. Stopping any old server instances...
taskkill /F /IM node.exe >nul 2>&1
echo 2. Clearing old connections...
echo.
echo 3. Starting the FRESH server...
echo.
echo [SERVER OUTPUT WILL APPEAR BELOW]
echo -------------------------------------------
node server.js
pause
