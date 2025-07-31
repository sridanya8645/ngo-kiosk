# Railway Setup Script for NGO Kiosk App
Write-Host "=== Railway Setup for NGO Kiosk App ===" -ForegroundColor Green

Write-Host "Step 1: Building React frontend..." -ForegroundColor Yellow
npm run build

Write-Host "Step 2: Copying build files to backend..." -ForegroundColor Yellow
if (Test-Path "build") {
    if (Test-Path "backend/public") {
        Remove-Item "backend/public" -Recurse -Force
    }
    Copy-Item -Recurse -Force "build\*" "backend\public\"
    Write-Host "Frontend build copied to backend" -ForegroundColor Green
} else {
    Write-Host "Build folder not found, please run 'npm run build' first" -ForegroundColor Red
    exit 1
}

Write-Host "Step 3: Checking backend configuration..." -ForegroundColor Yellow
if (Test-Path "backend/server.js") {
    Write-Host "backend/server.js found" -ForegroundColor Green
} else {
    Write-Host "backend/server.js not found" -ForegroundColor Red
    exit 1
}

if (Test-Path "backend/db.js") {
    Write-Host "backend/db.js found" -ForegroundColor Green
} else {
    Write-Host "backend/db.js not found" -ForegroundColor Red
    exit 1
}

if (Test-Path "backend/package.json") {
    Write-Host "backend/package.json found" -ForegroundColor Green
} else {
    Write-Host "backend/package.json not found" -ForegroundColor Red
    exit 1
}

Write-Host "Step 4: Creating .gitignore for Railway..." -ForegroundColor Yellow
$gitignoreContent = @"
node_modules/
.env
.DS_Store
*.log
build/
dist/
"@

Set-Content "backend/.gitignore" $gitignoreContent
Write-Host "Created backend/.gitignore" -ForegroundColor Green

Write-Host "Step 5: Creating Railway configuration..." -ForegroundColor Yellow
$railwayJson = @"
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
"@

Set-Content "railway.json" $railwayJson
Write-Host "Created railway.json" -ForegroundColor Green

Write-Host "=== Railway Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Go to railway.app and create account" -ForegroundColor White
Write-Host "2. Create new project" -ForegroundColor White
Write-Host "3. Add MySQL database service" -ForegroundColor White
Write-Host "4. Add GitHub repo service (point to backend folder)" -ForegroundColor White
Write-Host "5. Deploy!" -ForegroundColor White
Write-Host ""
Write-Host "Your app will be available at: https://your-app-name.railway.app" -ForegroundColor Green 