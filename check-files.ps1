Write-Host "=== NGO Kiosk Azure MySQL File Check ===" -ForegroundColor Green

# Check database configuration
Write-Host "Checking database configuration..." -ForegroundColor Yellow
if (Test-Path "backend/db.js") {
    $content = Get-Content "backend/db.js" -Raw
    if ($content -match "ngo-kiosk-mysql.mysql.database.azure.com") {
        Write-Host "Database configured for Azure MySQL" -ForegroundColor Green
    } else {
        Write-Host "Database may not be configured for Azure MySQL" -ForegroundColor Yellow
    }
} else {
    Write-Host "backend/db.js not found" -ForegroundColor Red
}

# Check package.json for MySQL dependency
Write-Host "Checking package.json..." -ForegroundColor Yellow
if (Test-Path "backend/package.json") {
    $content = Get-Content "backend/package.json" -Raw
    if ($content -match "mysql2") {
        Write-Host "MySQL2 dependency found" -ForegroundColor Green
    } else {
        Write-Host "MySQL2 dependency not found" -ForegroundColor Red
    }
} else {
    Write-Host "backend/package.json not found" -ForegroundColor Red
}

# Check server.js
Write-Host "Checking server.js..." -ForegroundColor Yellow
if (Test-Path "backend/server.js") {
    Write-Host "backend/server.js found" -ForegroundColor Green
} else {
    Write-Host "backend/server.js not found" -ForegroundColor Red
}

# Check frontend files
Write-Host "Checking frontend files..." -ForegroundColor Yellow
$frontendFiles = @("src/RegisterPage.js", "src/CheckinPage.js", "src/EventDetailsPage.js")
foreach ($file in $frontendFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match "azurewebsites\.net") {
            Write-Host "$file using Azure endpoints" -ForegroundColor Green
        } elseif ($content -match "elasticbeanstalk\.com") {
            Write-Host "$file still using AWS endpoints" -ForegroundColor Yellow
        } else {
            Write-Host "$file endpoint status unclear" -ForegroundColor Yellow
        }
    } else {
        Write-Host "$file not found" -ForegroundColor Red
    }
}

# Check migration scripts
Write-Host "Checking migration scripts..." -ForegroundColor Yellow
if (Test-Path "azure-migration.ps1") {
    Write-Host "azure-migration.ps1 found" -ForegroundColor Green
} else {
    Write-Host "azure-migration.ps1 not found" -ForegroundColor Red
}

if (Test-Path "migrate-to-azure.bat") {
    Write-Host "migrate-to-azure.bat found" -ForegroundColor Green
} else {
    Write-Host "migrate-to-azure.bat not found" -ForegroundColor Red
}

if (Test-Path "test-db-connection.js") {
    Write-Host "test-db-connection.js found" -ForegroundColor Green
} else {
    Write-Host "test-db-connection.js not found" -ForegroundColor Red
}

Write-Host "CHECK COMPLETE" -ForegroundColor Green
Write-Host "Ready for Azure MySQL Database creation!" -ForegroundColor Cyan 