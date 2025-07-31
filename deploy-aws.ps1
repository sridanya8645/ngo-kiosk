# AWS Elastic Beanstalk Deployment Script for NGO Kiosk
Write-Host "Starting AWS deployment..." -ForegroundColor Green

# Step 1: Build the React app
Write-Host "Building React app..." -ForegroundColor Yellow
npm run build

# Step 2: Copy build to backend
Write-Host "Copying build to backend..." -ForegroundColor Yellow
if (Test-Path "backend/public") {
    Remove-Item "backend/public" -Recurse -Force
}
Copy-Item "build" "backend/public" -Recurse

# Step 3: Copy source files to backend
Write-Host "Copying source files..." -ForegroundColor Yellow
if (Test-Path "backend/src") {
    Remove-Item "backend/src" -Recurse -Force
}
Copy-Item "src" "backend/src" -Recurse

if (Test-Path "backend/public-src") {
    Remove-Item "backend/public-src" -Recurse -Force
}
Copy-Item "public" "backend/public-src" -Recurse

# Step 4: Copy package files
Write-Host "Copying package files..." -ForegroundColor Yellow
Copy-Item "package.json" "backend/package-root.json"
Copy-Item "package-lock.json" "backend/package-lock-root.json"

# Step 5: Create .ebextensions directory
Write-Host "Creating Elastic Beanstalk configuration..." -ForegroundColor Yellow
if (!(Test-Path "backend/.ebextensions")) {
    New-Item -ItemType Directory -Path "backend/.ebextensions"
}

# Step 6: Create environment configuration
$envConfig = @"
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    DB_HOST: ngo-kiosk-db.cx0u04q26biy.us-east-2.rds.amazonaws.com
    DB_USER: admin
    DB_PASSWORD: MyApp2024!
    DB_NAME: ngo_kiosk
    DB_PORT: 3306
"@

$envConfig | Out-File -FilePath "backend/.ebextensions/environment.config" -Encoding UTF8

# Step 7: Create Procfile
$procfile = "web: npm start"
$procfile | Out-File -FilePath "backend/Procfile" -Encoding UTF8

# Step 8: Initialize Git repository in backend
Write-Host "Initializing Git repository..." -ForegroundColor Yellow
Set-Location backend
if (Test-Path ".git") {
    Remove-Item ".git" -Recurse -Force
}
git init
git add .
git commit -m "Initial AWS deployment"

# Step 9: Initialize Elastic Beanstalk
Write-Host "Initializing Elastic Beanstalk..." -ForegroundColor Yellow
eb init ngo-kiosk-app --platform node.js --region us-east-2

# Step 10: Create environment
Write-Host "Creating Elastic Beanstalk environment..." -ForegroundColor Yellow
eb create ngo-kiosk-env --instance-type t2.micro --single-instance

# Step 11: Deploy
Write-Host "Deploying to AWS..." -ForegroundColor Yellow
eb deploy

Write-Host "AWS deployment completed!" -ForegroundColor Green
Write-Host "Your app will be available at the URL shown above." -ForegroundColor Green

# Return to original directory
Set-Location .. 