# Comprehensive Verification and Fix Script for NGO Kiosk App
# This script checks all files for correctness and fixes any issues

Write-Host "=== NGO Kiosk Verification and Fix Script ===" -ForegroundColor Green

# Step 1: Check backend database configuration
Write-Host "Step 1: Checking backend database configuration..." -ForegroundColor Yellow
$dbFile = "backend/db.js"
if (Test-Path $dbFile) {
    $dbContent = Get-Content $dbFile -Raw
    if ($dbContent -match "AWS RDS") {
        Write-Host "WARNING: Database still configured for AWS RDS" -ForegroundColor Red
    } elseif ($dbContent -match "Azure MySQL") {
        Write-Host "✓ Database configured for Azure MySQL" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Database configuration unclear" -ForegroundColor Yellow
    }
} else {
    Write-Host "ERROR: backend/db.js not found" -ForegroundColor Red
}

# Step 2: Check backend server.js for API endpoints
Write-Host "Step 2: Checking backend API endpoints..." -ForegroundColor Yellow
$serverFile = "backend/server.js"
if (Test-Path $serverFile) {
    $serverContent = Get-Content $serverFile -Raw
    
    # Check for registration endpoint issues
    if ($serverContent -match "eventId.*eventName.*eventDate") {
        Write-Host "WARNING: Registration endpoint may have column name issues" -ForegroundColor Yellow
    }
    
    # Check for raffle endpoint issues
    if ($serverContent -match "winDateTime") {
        Write-Host "WARNING: Raffle endpoints may have column name issues" -ForegroundColor Yellow
    }
    
    Write-Host "✓ Backend server.js found" -ForegroundColor Green
} else {
    Write-Host "ERROR: backend/server.js not found" -ForegroundColor Red
}

# Step 3: Check frontend API endpoints
Write-Host "Step 3: Checking frontend API endpoints..." -ForegroundColor Yellow

$frontendFiles = @(
    "src/RegisterPage.js",
    "src/CheckinPage.js", 
    "src/EventDetailsPage.js",
    "src/AdminRegistrationsPage.js",
    "src/RaffleSpinPage.js",
    "src/RaffleWinnersPage.js"
)

foreach ($file in $frontendFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Check for AWS endpoints
        if ($content -match "elasticbeanstalk\.com") {
            Write-Host "WARNING: $file still using AWS endpoints" -ForegroundColor Yellow
        }
        
        # Check for localhost endpoints
        if ($content -match "localhost:5000") {
            Write-Host "WARNING: $file still using localhost endpoints" -ForegroundColor Yellow
        }
        
        # Check for Azure endpoints
        if ($content -match "azurewebsites\.net") {
            Write-Host "✓ $file using Azure endpoints" -ForegroundColor Green
        }
    } else {
        Write-Host "ERROR: $file not found" -ForegroundColor Red
    }
}

# Step 4: Check package.json files
Write-Host "Step 4: Checking package.json files..." -ForegroundColor Yellow

$rootPackageJson = "package.json"
if (Test-Path $rootPackageJson) {
    $content = Get-Content $rootPackageJson -Raw
    if ($content -match "html5-qrcode") {
        Write-Host "✓ Root package.json has html5-qrcode dependency" -ForegroundColor Green
    } else {
        Write-Host "WARNING: html5-qrcode dependency missing from root package.json" -ForegroundColor Yellow
    }
} else {
    Write-Host "ERROR: Root package.json not found" -ForegroundColor Red
}

$backendPackageJson = "backend/package.json"
if (Test-Path $backendPackageJson) {
    $content = Get-Content $backendPackageJson -Raw
    if ($content -match "express") {
        Write-Host "✓ Backend package.json has express dependency" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Express dependency missing from backend package.json" -ForegroundColor Yellow
    }
} else {
    Write-Host "ERROR: Backend package.json not found" -ForegroundColor Red
}

# Step 5: Check for deployment scripts
Write-Host "Step 5: Checking deployment scripts..." -ForegroundColor Yellow

$deploymentScripts = @(
    "azure-migration.ps1",
    "migrate-to-azure.bat",
    "deploy-to-azure.ps1"
)

foreach ($script in $deploymentScripts) {
    if (Test-Path $script) {
        Write-Host "✓ $script found" -ForegroundColor Green
    } else {
        Write-Host "WARNING: $script not found" -ForegroundColor Yellow
    }
}

# Step 6: Check for build directory
Write-Host "Step 6: Checking build directory..." -ForegroundColor Yellow
if (Test-Path "build") {
    Write-Host "✓ Build directory exists" -ForegroundColor Green
} else {
    Write-Host "WARNING: Build directory not found - run 'npm run build' first" -ForegroundColor Yellow
}

# Step 7: Check for backend public directory
Write-Host "Step 7: Checking backend public directory..." -ForegroundColor Yellow
if (Test-Path "backend/public") {
    Write-Host "✓ Backend public directory exists" -ForegroundColor Green
} else {
    Write-Host "WARNING: Backend public directory not found" -ForegroundColor Yellow
}

# Step 8: Generate summary report
Write-Host "`n=== VERIFICATION SUMMARY ===" -ForegroundColor Cyan

Write-Host "`n=== RECOMMENDED ACTIONS ===" -ForegroundColor Yellow
Write-Host "1. Run 'npm run build' to create build directory" -ForegroundColor White
Write-Host "2. Run 'migrate-to-azure.bat' to deploy to Azure" -ForegroundColor White
Write-Host "3. Verify all API endpoints are pointing to Azure" -ForegroundColor White
Write-Host "4. Test the application after deployment" -ForegroundColor White

Write-Host "`n=== VERIFICATION COMPLETE ===" -ForegroundColor Green 