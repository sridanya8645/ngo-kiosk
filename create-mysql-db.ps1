# Create Azure MySQL Database for NGO Kiosk
Write-Host "=== Creating Azure MySQL Database ===" -ForegroundColor Green

# Parameters
$ResourceGroupName = "ngo-kiosk-rg"
$Location = "Central US"
$MySqlServerName = "ngo-kiosk-mysql"
$DatabaseName = "ngo_kiosk"

Write-Host "Step 1: Creating MySQL Server..." -ForegroundColor Yellow
az mysql server create `
    --resource-group $ResourceGroupName `
    --name $MySqlServerName `
    --location $Location `
    --admin-user ngo_admin `
    --admin-password "MyApp2024!" `
    --sku-name B_Gen5_1 `
    --version 8.0

Write-Host "Step 2: Creating Database..." -ForegroundColor Yellow
az mysql db create `
    --resource-group $ResourceGroupName `
    --server-name $MySqlServerName `
    --name $DatabaseName

Write-Host "Step 3: Configuring Firewall..." -ForegroundColor Yellow
az mysql server firewall-rule create `
    --resource-group $ResourceGroupName `
    --server-name $MySqlServerName `
    --name "AllowAzureServices" `
    --start-ip-address 0.0.0.0 `
    --end-ip-address 0.0.0.0

Write-Host "=== MySQL Database Created Successfully! ===" -ForegroundColor Green
Write-Host "Server: $MySqlServerName.mysql.database.azure.com" -ForegroundColor Cyan
Write-Host "Database: $DatabaseName" -ForegroundColor Cyan
Write-Host "Username: ngo_admin@$MySqlServerName" -ForegroundColor Cyan
Write-Host "Password: MyApp2024!" -ForegroundColor Cyan 