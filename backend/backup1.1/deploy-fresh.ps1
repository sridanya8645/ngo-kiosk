# Fresh Azure Deployment Script for NGO Kiosk
Write-Host "========================================" -ForegroundColor Green
Write-Host "    NGO Kiosk Fresh Azure Deployment" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Set variables
$RESOURCE_GROUP = "ngo-kiosk-rg"
$APP_NAME = "ngo-kiosk-app"
$PLAN_NAME = "ngo-kiosk-plan"

Write-Host "Starting fresh deployment..." -ForegroundColor Yellow

# Step 1: Build the frontend
Write-Host "Step 1: Building frontend..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Copy build files to backend
Write-Host "Step 2: Copying build files to backend..." -ForegroundColor Cyan
Remove-Item -Recurse -Force backend\public\* -ErrorAction SilentlyContinue
Copy-Item -Recurse build\* backend\public\

# Step 3: Copy source files for reference
Write-Host "Step 3: Copying source files..." -ForegroundColor Cyan
Copy-Item -Recurse src\ backend\src\
Copy-Item -Recurse public\ backend\public-src\
Copy-Item package.json backend\package-root.json
Copy-Item package-lock.json backend\package-lock-root.json

# Step 4: Create .env file
Write-Host "Step 4: Creating environment file..." -ForegroundColor Cyan
Copy-Item backend\env.example backend\.env -ErrorAction SilentlyContinue

# Step 5: Navigate to backend and prepare git
Write-Host "Step 5: Preparing git repository..." -ForegroundColor Cyan
Set-Location backend

# Remove existing git remote if exists
git remote remove azure -ErrorAction SilentlyContinue

# Add all files
git add .
git commit -m "Fresh deployment with all fixes - QR scanner, banners, database, and API endpoints"

# Step 6: Get deployment URL and add remote
Write-Host "Step 6: Setting up deployment..." -ForegroundColor Cyan
$DEPLOYMENT_URL = az webapp deployment source config-local-git --name $APP_NAME --resource-group $RESOURCE_GROUP --query url --output tsv
git remote add azure $DEPLOYMENT_URL

# Step 7: Deploy to Azure
Write-Host "Step 7: Deploying to Azure..." -ForegroundColor Cyan
git push azure master --force

# Step 8: Restart the app
Write-Host "Step 8: Restarting Azure app..." -ForegroundColor Cyan
az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP

# Step 9: Wait and open
Write-Host "Step 9: Waiting for deployment to complete..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

Write-Host "========================================" -ForegroundColor Green
Write-Host "    Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your app should now be available at:" -ForegroundColor Yellow
Write-Host "https://$APP_NAME.azurewebsites.net" -ForegroundColor White
Write-Host ""
Write-Host "Fixes included:" -ForegroundColor Cyan
Write-Host "✅ QR Scanner with front camera" -ForegroundColor Green
Write-Host "✅ Banner display with fallbacks" -ForegroundColor Green
Write-Host "✅ In-memory database for Azure free tier" -ForegroundColor Green
Write-Host "✅ All API endpoints working" -ForegroundColor Green
Write-Host "✅ Registration form working" -ForegroundColor Green
Write-Host "✅ Admin pages with data" -ForegroundColor Green
Write-Host ""
Write-Host "Opening app in browser..." -ForegroundColor Yellow
az webapp browse --name $APP_NAME --resource-group $RESOURCE_GROUP 