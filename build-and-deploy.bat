@echo off
echo ========================================
echo   NGO Kiosk App - Build and Deploy
echo ========================================
echo.

echo Step 1: Building React application...
call npm run build
if %errorlevel% neq 0 (
    echo Error: Build failed!
    pause
    exit /b 1
)
echo Build completed successfully!
echo.

echo Step 2: Copying build files to backend...
xcopy /E /I /Y build backend\public
if %errorlevel% neq 0 (
    echo Error: Failed to copy build files!
    pause
    exit /b 1
)
echo Build files copied successfully!
echo.

echo Step 3: Checking Azure CLI...
az --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Azure CLI is not installed or not in PATH!
    echo Please install Azure CLI from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
    pause
    exit /b 1
)
echo Azure CLI is available!
echo.

echo Step 4: Ready for deployment!
echo.
echo Next steps:
echo 1. Run: az login
echo 2. Run: .\azure-deploy-script.ps1
echo 3. Or follow the manual steps in AZURE_DEPLOYMENT.md
echo.
echo ========================================
echo Build process completed successfully!
echo ========================================
pause 