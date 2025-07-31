# Azure Migration Script for NGO Kiosk App
Write-Host "=== Azure Migration for NGO Kiosk App ===" -ForegroundColor Green

# Parameters
$ResourceGroupName = "ngo-kiosk-rg"
$Location = "Central US"
$AppServicePlanName = "ngo-kiosk-plan"
$WebAppName = "ngo-kiosk-app"
$MySqlServerName = "ngo-kiosk-mysql"
$DatabaseName = "ngo_kiosk"

Write-Host "Step 1: Checking if Resource Group exists..." -ForegroundColor Yellow
$rg = az group show --name $ResourceGroupName 2>$null
if (-not $rg) {
    Write-Host "Creating Resource Group..." -ForegroundColor Yellow
    az group create --name $ResourceGroupName --location $Location
} else {
    Write-Host "Resource Group already exists" -ForegroundColor Green
}

Write-Host "Step 2: Checking if MySQL Server exists..." -ForegroundColor Yellow
$mysqlServer = az mysql flexible-server show --resource-group $ResourceGroupName --name $MySqlServerName 2>$null
if (-not $mysqlServer) {
    Write-Host "Creating MySQL Server..." -ForegroundColor Yellow
    az mysql flexible-server create `
        --resource-group $ResourceGroupName `
        --name $MySqlServerName `
        --location $Location `
        --admin-user ngo_admin `
        --admin-password "MyApp2024!" `
        --sku-name Standard_B1ms `
        --version 8.0.21 `
        --yes
} else {
    Write-Host "MySQL Server already exists" -ForegroundColor Green
}

Write-Host "Step 3: Creating Database..." -ForegroundColor Yellow
az mysql flexible-server db create `
    --resource-group $ResourceGroupName `
    --server-name $MySqlServerName `
    --name $DatabaseName

Write-Host "Step 4: Configuring Firewall..." -ForegroundColor Yellow
az mysql flexible-server firewall-rule create `
    --resource-group $ResourceGroupName `
    --server-name $MySqlServerName `
    --name "AllowAzureServices" `
    --start-ip-address 0.0.0.0 `
    --end-ip-address 0.0.0.0

Write-Host "Step 5: Checking if App Service Plan exists..." -ForegroundColor Yellow
$plan = az appservice plan show --resource-group $ResourceGroupName --name $AppServicePlanName 2>$null
if (-not $plan) {
    Write-Host "Creating App Service Plan..." -ForegroundColor Yellow
    az appservice plan create `
        --resource-group $ResourceGroupName `
        --name $AppServicePlanName `
        --location $Location `
        --sku F1 `
        --is-linux
} else {
    Write-Host "App Service Plan already exists" -ForegroundColor Green
}

Write-Host "Step 6: Checking if Web App exists..." -ForegroundColor Yellow
$webapp = az webapp show --resource-group $ResourceGroupName --name $WebAppName 2>$null
if (-not $webapp) {
    Write-Host "Creating Web App..." -ForegroundColor Yellow
    az webapp create `
        --resource-group $ResourceGroupName `
        --plan $AppServicePlanName `
        --name $WebAppName `
        --runtime "NODE|18-lts"
} else {
    Write-Host "Web App already exists" -ForegroundColor Green
}

Write-Host "Step 7: Setting Environment Variables..." -ForegroundColor Yellow
az webapp config appsettings set `
    --resource-group $ResourceGroupName `
    --name $WebAppName `
    --settings `
    DB_HOST="$MySqlServerName.mysql.database.azure.com" `
    DB_USER="ngo_admin@$MySqlServerName" `
    DB_PASSWORD="MyApp2024!" `
    DB_NAME=$DatabaseName `
    DB_PORT=3306 `
    NODE_ENV=production

Write-Host "Step 8: Building Frontend..." -ForegroundColor Yellow
npm run build

Write-Host "Step 9: Copying Build to Backend..." -ForegroundColor Yellow
if (Test-Path "build") {
    Copy-Item -Recurse -Force "build\*" "backend\public\"
    Write-Host "Frontend build copied to backend" -ForegroundColor Green
} else {
    Write-Host "Build folder not found, skipping..." -ForegroundColor Yellow
}

Write-Host "Step 10: Deploying to Azure..." -ForegroundColor Yellow
az webapp deployment source config-zip `
    --resource-group $ResourceGroupName `
    --name $WebAppName `
    --src "backend.zip"

Write-Host "=== Migration Complete! ===" -ForegroundColor Green
Write-Host "Your app is available at: https://$WebAppName.azurewebsites.net" -ForegroundColor Cyan
Write-Host "MySQL Server: $MySqlServerName.mysql.database.azure.com" -ForegroundColor Cyan
Write-Host "Database: $DatabaseName" -ForegroundColor Cyan
Write-Host "Username: ngo_admin@$MySqlServerName" -ForegroundColor Cyan
Write-Host "Password: MyApp2024!" -ForegroundColor Cyan 