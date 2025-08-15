@echo off
echo Starting NGO Kiosk Application...
echo.

echo Starting Backend Server...
cd backend
start "Backend Server" cmd /k "npm start"

echo.
echo Starting Frontend Server...
cd ..
start "Frontend Server" cmd /k "npm start"

echo.
echo Application is starting...
echo.
echo To access from other devices:
echo 1. Find your computer's IP address by running: ipconfig
echo 2. Look for "IPv4 Address" (usually starts with 192.168.x.x or 10.x.x.x)
echo 3. Access the app from iPad using: http://YOUR_IP_ADDRESS:3000
echo.
echo Example: http://192.168.1.100:3000
echo.
pause 