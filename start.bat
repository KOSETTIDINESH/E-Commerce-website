@echo off
TITLE Six Wings Clothing E-Commerce
echo ==============================================================
echo   SIX WINGS — FULL-STACK CLOTHING E-COMMERCE PLATFORM
echo   Luxury Streetwear Atelier & Simulated Payment Gateway
echo ==============================================================
echo.

REM Set local node environment
set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"

echo Checking Node.js installation...
node -v >nul 2>&1
if %errorlevel% neq 0 (
  echo Node.js is not found on PATH. Please ensure Node.js is installed.
  pause
  exit /b 1
)

echo.
echo Starting Six Wings Full-Stack Server on http://localhost:5000 ...
echo - Backend API: http://localhost:5000/api
echo - Storefront:   http://localhost:5000/
echo - Admin Portal: http://localhost:5000 (Click 'Admin' in top right)
echo.
echo Demo Credentials:
echo - Admin:    admin@sixwings.com  /  Admin@SixWings2026
echo - Customer: alex@example.com       /  Customer@123
echo.
echo Press Ctrl+C at any time to stop the server.
echo ==============================================================
echo.

cd /d "%~dp0backend"
node src/server.js
pause
