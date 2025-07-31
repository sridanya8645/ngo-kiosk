@echo off
echo Starting AWS deployment...
powershell -ExecutionPolicy Bypass -File "deploy-aws.ps1"
pause 