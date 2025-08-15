# NGO Kiosk Azure Migration Guide

## Overview
This guide documents the complete migration of the NGO Kiosk application from AWS to Azure, including the setup of Azure MySQL Database and all necessary configuration changes.

## Changes Made

### 1. Database Configuration (`backend/db.js`)
- **Before**: Configured for AWS RDS MySQL
- **After**: Updated for Azure MySQL Database
- **Changes**:
  - Host: `ngo-kiosk-mysql.mysql.database.azure.com`
  - User: `ngo_admin@ngo-kiosk-mysql`
  - Removed database creation logic (Azure MySQL requires database to exist)
  - Updated SSL configuration for Azure

### 2. Backend API Endpoints (`backend/server.js`)
- **Fixed Registration Endpoint**: Corrected column names from `eventId`, `eventName`, `eventDate` to `event_id`, `event_name`, `event_date`
- **Fixed Raffle Endpoints**: Updated column names and table structure
- **Added Proper Error Handling**: Enhanced error messages and logging

### 3. Frontend API Endpoints
- **Updated All Frontend Files**: Changed from AWS Elastic Beanstalk to Azure App Service
- **Files Updated**:
  - `src/RegisterPage.js`
  - `src/CheckinPage.js`
  - `src/EventDetailsPage.js`
  - `src/AdminRegistrationsPage.js`
  - `src/RaffleSpinPage.js`
  - `src/RaffleWinnersPage.js`

### 4. Database Schema
- **Users Table**: Admin and user accounts
- **Events Table**: Event management with banners
- **Registrations Table**: User registrations with check-in status
- **Raffle Winners Table**: Raffle winner tracking

## Migration Scripts

### 1. `azure-migration.ps1`
**Complete Azure Migration Script**
- Creates Azure Resource Group
- Sets up Azure MySQL Database Server
- Creates App Service Plan and Web App
- Configures environment variables
- Updates all frontend API endpoints
- Builds and deploys the application

### 2. `migrate-to-azure.bat`
**Simple Batch File**
- Runs the PowerShell migration script
- Provides user-friendly interface

### 3. `verify-and-fix.ps1`
**Verification Script**
- Checks all files for correctness
- Identifies any remaining AWS/localhost endpoints
- Validates database configuration
- Provides recommendations for fixes

## How to Use

### Prerequisites
1. **Azure CLI**: Install and login
   ```bash
   az login
   ```

2. **Node.js**: Ensure npm is available
   ```bash
   npm --version
   ```

3. **Git**: For deployment
   ```bash
   git --version
   ```

### Step-by-Step Migration

#### Option 1: Automated Migration (Recommended)
1. **Run the migration script**:
   ```bash
   migrate-to-azure.bat
   ```
   This will:
   - Create all Azure resources
   - Update all API endpoints
   - Build and deploy the application

#### Option 2: Manual Migration
1. **Create Azure Resources**:
   ```bash
   # Create Resource Group
   az group create --name ngo-kiosk-rg --location "East US"
   
   # Create MySQL Server
   az mysql server create --resource-group ngo-kiosk-rg --name ngo-kiosk-mysql --location "East US" --admin-user ngo_admin --admin-password "MyApp2024!" --sku-name B_Gen5_1 --version 8.0
   
   # Create Database
   az mysql db create --resource-group ngo-kiosk-rg --server-name ngo-kiosk-mysql --name ngo_kiosk
   
   # Create App Service
   az appservice plan create --name ngo-kiosk-plan --resource-group ngo-kiosk-rg --sku B1 --is-linux
   az webapp create --name ngo-kiosk-app --resource-group ngo-kiosk-rg --plan ngo-kiosk-plan --runtime "NODE|18-lts"
   ```

2. **Configure Environment Variables**:
   ```bash
   az webapp config appsettings set --name ngo-kiosk-app --resource-group ngo-kiosk-rg --settings NODE_ENV=production PORT=8080 DB_HOST="ngo-kiosk-mysql.mysql.database.azure.com" DB_USER="ngo_admin@ngo-kiosk-mysql" DB_PASSWORD="MyApp2024!" DB_NAME="ngo_kiosk" DB_PORT=3306
   ```

3. **Build and Deploy**:
   ```bash
   npm install
   npm run build
   # Copy build files to backend/public
   # Deploy to Azure
   ```

### Verification
Run the verification script to check everything:
```bash
powershell -ExecutionPolicy Bypass -File "verify-and-fix.ps1"
```

## Azure Resources Created

### 1. Resource Group
- **Name**: `ngo-kiosk-rg`
- **Location**: East US

### 2. Azure MySQL Database
- **Server**: `ngo-kiosk-mysql.mysql.database.azure.com`
- **Database**: `ngo_kiosk`
- **Username**: `ngo_admin@ngo-kiosk-mysql`
- **Password**: `MyApp2024!`
- **SKU**: B_Gen5_1 (Basic tier)

### 3. Azure App Service
- **App Name**: `ngo-kiosk-app`
- **Plan**: `ngo-kiosk-plan`
- **Runtime**: Node.js 18 LTS
- **URL**: `https://ngo-kiosk-app.azurewebsites.net`

## API Endpoints

### Authentication
- `POST /api/login` - Admin login

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/todays-event` - Get today's event

### Registrations
- `POST /api/register` - Register for event
- `GET /api/registrations` - Get all registrations
- `POST /api/checkin` - Check-in by phone
- `POST /api/registrations/:id/checkin` - Check-in by ID
- `POST /api/registrations/reset-checkins` - Reset all check-ins

### Raffle
- `GET /api/raffle/eligible-users` - Get eligible users
- `POST /api/raffle/save-winner` - Save raffle winner
- `GET /api/raffle/winners` - Get raffle winners
- `GET /api/raffle-winners` - Alternative endpoint for winners

### File Upload
- `POST /api/upload-banner` - Upload event banner

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check firewall rules in Azure MySQL
   - Verify connection string in App Service settings
   - Ensure SSL is properly configured

2. **API Endpoints Not Working**
   - Verify all frontend files are updated to use Azure URL
   - Check CORS configuration
   - Ensure App Service is running

3. **Build Failures**
   - Run `npm install` in root directory
   - Ensure all dependencies are installed
   - Check for any missing files

4. **Deployment Issues**
   - Verify Azure CLI is logged in
   - Check resource group permissions
   - Ensure all required resources are created

### Verification Commands
```bash
# Check Azure resources
az resource list --resource-group ngo-kiosk-rg

# Check App Service logs
az webapp log tail --name ngo-kiosk-app --resource-group ngo-kiosk-rg

# Test database connection
az mysql server show --name ngo-kiosk-mysql --resource-group ngo-kiosk-rg
```

## Security Considerations

1. **Database Security**
   - Use strong passwords
   - Enable SSL connections
   - Configure firewall rules properly

2. **App Service Security**
   - Use environment variables for sensitive data
   - Enable HTTPS only
   - Configure proper CORS settings

3. **API Security**
   - Implement proper authentication
   - Validate all inputs
   - Use HTTPS for all communications

## Cost Optimization

1. **Free Tier Usage**
   - Use Basic tier for MySQL Database
   - Use Basic tier for App Service Plan
   - Monitor usage to stay within free limits

2. **Resource Management**
   - Delete unused resources
   - Monitor costs in Azure Portal
   - Set up billing alerts

## Support

For issues or questions:
1. Check Azure Portal for resource status
2. Review application logs
3. Run verification script for diagnostics
4. Check this guide for common solutions

## Next Steps

After successful migration:
1. Test all functionality thoroughly
2. Set up monitoring and alerts
3. Configure backup strategies
4. Plan for scaling as needed
5. Document any custom configurations 