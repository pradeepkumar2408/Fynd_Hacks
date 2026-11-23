@echo off
echo ========================================================
echo       Starting TechStore Checkout Single-Page App
echo ========================================================
echo.

echo 1. Starting Spring Boot Backend (Port 8080)...
start "Checkout Backend" cmd /k "cd /d D:\FyndHack\backend && mvnw.cmd spring-boot:run"

echo 2. Waiting for backend initialization...
timeout /t 5 /nobreak >nul

echo 3. Starting React Frontend (Port 5173)...
start "Checkout Frontend" cmd /k "cd /d D:\FyndHack\frontend && npm run dev"

echo 4. Opening Checkout Page in Browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo Application is up and running!
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:8080/api/products
echo ========================================================
