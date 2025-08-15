@echo off
echo ========================================
echo    NGO Kiosk Azure Deployment
echo ========================================
echo.
echo Starting complete deployment to Azure...
echo.

REM Run the PowerShell deployment script
powershell -ExecutionPolicy Bypass -File "deploy-to-azure.ps1"

echo.
echo Deployment script completed!
echo Check the output above for any errors.
echo.
pause 