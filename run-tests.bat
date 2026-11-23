@echo off
echo ========================================================
echo       Running Playwright Browser Test Suite
echo ========================================================
echo.
cd /d D:\FyndHack\frontend
call npx playwright test --headed
echo.
pause
