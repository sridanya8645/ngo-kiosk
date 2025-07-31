@echo off
echo Creating AWS Deployment ZIP file...
echo.

echo Step 1: Building React app...
npm run build

echo Step 2: Copying build to backend...
if exist "backend\public" rmdir /s /q "backend\public"
xcopy "build\*" "backend\public\" /e /i /y

echo Step 3: Creating ZIP file...
echo Please manually create a ZIP file containing the entire "backend" folder
echo.
echo Instructions:
echo 1. Right-click on the "backend" folder
echo 2. Select "Send to" > "Compressed (zipped) folder"
echo 3. Rename the ZIP file to "ngo-kiosk-aws-deploy.zip"
echo.
echo Your deployment ZIP is ready!
echo.
pause 