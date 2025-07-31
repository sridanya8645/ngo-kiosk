Write-Host "Force deploying backend changes..." -ForegroundColor Green

cd backend

# Remove existing remote
git remote remove azure -ErrorAction SilentlyContinue

# Add new remote
git remote add azure https://ngo-kiosk-deploy@ngo-kiosk-app-fmh6acaxd4czgyh4.scm.centralus-01.azurewebsites.net/ngo-kiosk-app.git

# Force push
git push azure master --force

Write-Host "Deployment complete!" -ForegroundColor Green 