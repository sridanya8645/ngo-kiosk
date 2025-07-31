# Complete Azure Deployment Script for NGO Kiosk App
# This script handles the entire deployment process

param(
    [string]$ResourceGroupName = "ngo-kiosk-rg",
    [string]$Location = "East US",
    [string]$AppName = "ngo-kiosk-app",
    [string]$PlanName = "ngo-kiosk-plan",
    [string]$Sku = "B1"
)

Write-Host "=== NGO Kiosk Complete Azure Deployment ===" -ForegroundColor Green

# Step 1: Login to Azure
Write-Host "Step 1: Logging into Azure..." -ForegroundColor Yellow
az login

# Step 2: Create Resource Group
Write-Host "Step 2: Creating Resource Group..." -ForegroundColor Yellow
az group create --name $ResourceGroupName --location $Location

# Step 3: Create App Service Plan
Write-Host "Step 3: Creating App Service Plan..." -ForegroundColor Yellow
az appservice plan create --name $PlanName --resource-group $ResourceGroupName --sku $Sku --is-linux

# Step 4: Create Web App
Write-Host "Step 4: Creating Web App..." -ForegroundColor Yellow
az webapp create --name $AppName --resource-group $ResourceGroupName --plan $PlanName --runtime "NODE|18-lts"

# Step 5: Configure environment variables
Write-Host "Step 5: Configuring environment variables..." -ForegroundColor Yellow
az webapp config appsettings set --name $AppName --resource-group $ResourceGroupName --settings NODE_ENV=production PORT=8080

# Step 6: Configure startup command
Write-Host "Step 6: Configuring startup command..." -ForegroundColor Yellow
az webapp config set --name $AppName --resource-group $ResourceGroupName --startup-file "npm start"

# Step 7: Enable local Git deployment
Write-Host "Step 7: Enabling local Git deployment..." -ForegroundColor Yellow
az webapp deployment source config-local-git --name $AppName --resource-group $ResourceGroupName

# Step 8: Get deployment URL
Write-Host "Step 8: Getting deployment URL..." -ForegroundColor Yellow
$deploymentUrl = az webapp deployment source config-local-git --name $AppName --resource-group $ResourceGroupName --query url --output tsv

Write-Host "Deployment URL: $deploymentUrl" -ForegroundColor Green

# Step 9: Install frontend dependencies and build
Write-Host "Step 9: Installing frontend dependencies..." -ForegroundColor Yellow
npm install

Write-Host "Step 10: Building React application..." -ForegroundColor Yellow
npm run build

# Step 11: Copy build files to backend
Write-Host "Step 11: Copying build files to backend..." -ForegroundColor Yellow
if (Test-Path "build") {
    if (Test-Path "backend/public") {
        Remove-Item "backend/public" -Recurse -Force
    }
    Copy-Item "build" "backend/public" -Recurse
    Write-Host "Build files copied to backend/public" -ForegroundColor Green
} else {
    Write-Host "Error: Build directory not found. Please check if npm run build completed successfully." -ForegroundColor Red
    exit 1
}

# Step 12: Copy all necessary files to backend
Write-Host "Step 12: Copying all files to backend..." -ForegroundColor Yellow

# Copy package.json from root to backend if it doesn't exist
if (-not (Test-Path "backend/package.json")) {
    Copy-Item "package.json" "backend/package.json"
}

# Copy all source files
Write-Host "Copying source files..." -ForegroundColor Cyan
Copy-Item "src" "backend/src" -Recurse -Force
Copy-Item "public" "backend/public-src" -Recurse -Force

# Copy configuration files
Write-Host "Copying configuration files..." -ForegroundColor Cyan
Copy-Item "package.json" "backend/package-root.json" -Force
Copy-Item "package-lock.json" "backend/package-lock-root.json" -Force

# Copy environment example file
if (Test-Path "backend/env.example") {
    Copy-Item "backend/env.example" "backend/.env" -Force
    Write-Host "Environment file copied" -ForegroundColor Green
}

# Step 13: Deploy the application
Write-Host "Step 13: Deploying application..." -ForegroundColor Yellow

# Navigate to backend directory
Set-Location "backend"

# Initialize git repository
if (-not (Test-Path ".git")) {
    git init
}

# Add all files
git add .

# Commit changes
git commit -m "Complete deployment with MySQL backend - $(Get-Date)"

# Add Azure remote
git remote remove azure -ErrorAction SilentlyContinue
git remote add azure $deploymentUrl

# Push to Azure
Write-Host "Pushing to Azure..." -ForegroundColor Yellow
git push azure master --force

# Navigate back to root
Set-Location ".."

Write-Host "=== Deployment Completed Successfully! ===" -ForegroundColor Green
Write-Host "Your app is available at: https://$AppName.azurewebsites.net" -ForegroundColor Green
Write-Host "Azure Portal: https://portal.azure.com" -ForegroundColor Green

# Step 14: Verify deployment
Write-Host "Step 14: Verifying deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
az webapp browse --name $AppName --resource-group $ResourceGroupName

Write-Host "=== Deployment Complete! ===" -ForegroundColor Green
Write-Host "IMPORTANT: Configure MySQL database connection in Azure App Settings" -ForegroundColor Yellow
Write-Host "Add these environment variables in Azure Portal:" -ForegroundColor Cyan
Write-Host "DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT" -ForegroundColor White 