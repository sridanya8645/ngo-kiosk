# Azure Deployment Script for NGO Kiosk App
# This script automates the deployment process to Azure

param(
    [string]$ResourceGroupName = "ngo-kiosk-rg",
    [string]$Location = "East US",
    [string]$AppName = "ngo-kiosk-app",
    [string]$PlanName = "ngo-kiosk-plan",
    [string]$Sku = "B1"
)

Write-Host "Starting Azure deployment for NGO Kiosk App..." -ForegroundColor Green

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

# Step 9: Build the React app
Write-Host "Step 9: Building React application..." -ForegroundColor Yellow
npm run build

# Step 10: Copy build files to backend
Write-Host "Step 10: Copying build files to backend..." -ForegroundColor Yellow
if (Test-Path "build") {
    if (Test-Path "backend/public") {
        Remove-Item "backend/public" -Recurse -Force
    }
    Copy-Item "build" "backend/public" -Recurse
    Write-Host "Build files copied to backend/public" -ForegroundColor Green
} else {
    Write-Host "Warning: Build directory not found. Please run 'npm run build' first." -ForegroundColor Yellow
}

# Step 11: Deploy the application
Write-Host "Step 11: Deploying application..." -ForegroundColor Yellow
Write-Host "Please run the following commands in the backend directory:" -ForegroundColor Cyan
Write-Host "cd backend" -ForegroundColor White
Write-Host "git init" -ForegroundColor White
Write-Host "git add ." -ForegroundColor White
Write-Host "git commit -m 'Complete deployment with all files'" -ForegroundColor White
Write-Host "git remote add azure $deploymentUrl" -ForegroundColor White
Write-Host "git push azure master" -ForegroundColor White

Write-Host "Deployment setup completed!" -ForegroundColor Green
Write-Host "Your app will be available at: https://$AppName.azurewebsites.net" -ForegroundColor Green 