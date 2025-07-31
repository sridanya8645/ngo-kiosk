@echo off
echo Starting Azure Migration for NGO Kiosk App...
echo.
powershell -ExecutionPolicy Bypass -File "azure-migration.ps1"
echo.
echo Migration script completed.
pause 