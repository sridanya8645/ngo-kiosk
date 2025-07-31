# Complete Azure Deployment Guide for NGO Kiosk App

This guide provides comprehensive instructions to deploy your complete NGO Kiosk application to Azure App Service.

## 🚀 Quick Deployment

### Option 1: Automated Deployment (Recommended)

Run the complete deployment script:

```powershell
.\deploy-to-azure.ps1
```

This script will:
- ✅ Create all Azure resources
- ✅ Build the React frontend
- ✅ Copy all files to backend
- ✅ Deploy everything to Azure
- ✅ Open your application in browser

### Option 2: Manual Deployment

Follow the step-by-step instructions below.

## 📋 Prerequisites

1. **Azure Account**: Active Azure subscription
2. **Azure CLI**: Installed and configured
3. **Node.js**: Version 18+ installed
4. **Git**: For version control
5. **PowerShell**: For running deployment scripts
6. **MySQL Database**: Access to MySQL server (local or cloud)

## 🔧 Manual Deployment Steps

### Step 1: Login to Azure

```bash
az login
```

### Step 2: Set Variables

```bash
# Set your preferred values
RESOURCE_GROUP="ngo-kiosk-rg"
LOCATION="East US"
APP_NAME="ngo-kiosk-app"
PLAN_NAME="ngo-kiosk-plan"
SKU="B1"
```

### Step 3: Create Azure Resources

```bash
# Create Resource Group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create App Service Plan
az appservice plan create --name $PLAN_NAME --resource-group $RESOURCE_GROUP --sku $SKU --is-linux

# Create Web App
az webapp create --name $APP_NAME --resource-group $RESOURCE_GROUP --plan $PLAN_NAME --runtime "NODE|18-lts"
```

### Step 4: Configure Application Settings

```bash
# Configure environment variables
az webapp config appsettings set --name $APP_NAME --resource-group $RESOURCE_GROUP --settings NODE_ENV=production PORT=8080

# Configure startup command
az webapp config set --name $APP_NAME --resource-group $RESOURCE_GROUP --startup-file "npm start"
```

### Step 5: Build Frontend

```bash
# Install dependencies
npm install

# Build React application
npm run build
```

### Step 6: Prepare Backend for Deployment

```bash
# Copy build files to backend
cp -r build backend/public

# Copy all source files
cp -r src backend/src
cp -r public backend/public-src
cp package.json backend/package-root.json
cp package-lock.json backend/package-lock-root.json
```

### Step 7: Deploy to Azure

```bash
# Navigate to backend directory
cd backend

# Initialize git repository
git init
git add .
git commit -m "Complete deployment with MySQL backend"

# Get deployment URL
DEPLOYMENT_URL=$(az webapp deployment source config-local-git --name $APP_NAME --resource-group $RESOURCE_GROUP --query url --output tsv)

# Add Azure remote and deploy
git remote add azure $DEPLOYMENT_URL
git push azure master
```

## 📁 Deployment Structure

Your deployed application will include:

```
backend/
├── index.js                 # Main server file
├── package.json            # Backend dependencies
├── web.config              # Azure configuration
├── startup.sh              # Startup script
├── .env                    # Environment variables
├── public/                 # React build files
│   ├── index.html
│   ├── static/
│   └── ...
├── src/                    # React source files
├── data/                   # JSON data files
│   ├── events.json
│   ├── registrations.json
│   ├── users.json
│   └── raffle-winners.json
└── uploads/                # Uploaded files
```

## 🌐 Application URLs

After successful deployment:
- **Main Application**: `https://{APP_NAME}.azurewebsites.net`
- **Azure Portal**: `https://portal.azure.com`

## 🔧 Configuration Details

### Environment Variables

- `NODE_ENV=production`: Production environment
- `PORT=8080`: Application port
- `DB_HOST`: MySQL database host
- `DB_USER`: MySQL database user
- `DB_PASSWORD`: MySQL database password
- `DB_NAME`: MySQL database name
- `DB_PORT`: MySQL database port (default: 3306)

### MySQL Database Configuration

After deployment, configure MySQL connection in Azure App Settings:

1. Go to Azure Portal
2. Navigate to your App Service
3. Go to Configuration > Application settings
4. Add these environment variables:
   - `DB_HOST`: Your MySQL server host
   - `DB_USER`: MySQL username
   - `DB_PASSWORD`: MySQL password
   - `DB_NAME`: Database name (e.g., ngo_kiosk)
   - `DB_PORT`: MySQL port (usually 3306)

### Application Features Deployed

✅ **Frontend**: Complete React application with responsive design  
✅ **Backend**: Node.js Express server with all APIs  
✅ **Database**: MySQL database with all tables  
✅ **File Uploads**: Banner image upload functionality  
✅ **Email Service**: Registration confirmation emails  
✅ **QR Code Generation**: For check-in process  
✅ **Admin Panel**: Complete admin functionality  
✅ **Raffle System**: Winner selection and management  

## 🧪 Post-Deployment Testing

### 1. Test Core Functionality

1. **Home Page**: Verify responsive design on iPad Pro
2. **Registration**: Test user registration with email
3. **Check-in**: Test QR code scanning
4. **Admin Panel**: Test admin login and functions
5. **Raffle**: Test winner selection

### 2. Test Responsive Design

- ✅ iPad Pro 11" (Portrait & Landscape)
- ✅ iPad Pro 12.9" (Portrait & Landscape)
- ✅ Custom scrollbars
- ✅ Touch-friendly interface

### 3. Test Database Operations

- ✅ MySQL connection
- ✅ User registration
- ✅ Event management
- ✅ Check-in process
- ✅ Raffle winner selection

## 🔍 Troubleshooting

### Common Issues

1. **MySQL Connection Fails**:
   ```bash
   # Check environment variables in Azure
   az webapp config appsettings list --name $APP_NAME --resource-group $RESOURCE_GROUP
   
   # Update MySQL settings
   az webapp config appsettings set --name $APP_NAME --resource-group $RESOURCE_GROUP --settings DB_HOST=your-mysql-host DB_USER=your-username DB_PASSWORD=your-password DB_NAME=ngo_kiosk
   ```

2. **Build Fails**:
   ```bash
   # Check Node.js version
   node --version
   
   # Clear npm cache
   npm cache clean --force
   
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Deployment Fails**:
   ```bash
   # Check Azure CLI
   az --version
   
   # Check login status
   az account show
   
   # Check resource group
   az group show --name $RESOURCE_GROUP
   ```

4. **Application Not Starting**:
   ```bash
   # Check logs
   az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP
   
   # Restart application
   az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP
   ```

### Useful Commands

```bash
# View application logs
az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP

# Restart application
az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP

# Scale application
az appservice plan update --name $PLAN_NAME --resource-group $RESOURCE_GROUP --sku S1

# Delete resources (cleanup)
az group delete --name $RESOURCE_GROUP --yes
```

## 💰 Cost Optimization

- **Development**: Use F1 (Free) tier for testing
- **Production**: Use B1 (Basic) tier for small workloads
- **Scaling**: Upgrade to S1 (Standard) for higher traffic

## 🔒 Security Considerations

1. **Environment Variables**: Store sensitive data in Azure Key Vault
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure CORS settings appropriately
4. **Authentication**: Implement proper authentication for admin features
5. **Database Security**: Use strong passwords and restrict database access

## 📞 Support

For Azure-specific issues:
- [Azure Documentation](https://docs.microsoft.com/azure/)
- [Azure Support](https://azure.microsoft.com/support/)

For application-specific issues:
- Check the application logs
- Review the codebase for configuration issues

## 🎯 Success Checklist

After deployment, verify:

- ✅ Application loads at `https://{APP_NAME}.azurewebsites.net`
- ✅ All pages display correctly on iPad Pro
- ✅ Registration form works and sends emails
- ✅ Check-in process functions properly
- ✅ Admin panel is accessible
- ✅ MySQL database operations work correctly
- ✅ File uploads function properly
- ✅ QR codes generate and scan correctly
- ✅ Responsive design works on all screen sizes
- ✅ Custom scrollbars display properly

## 🚀 Next Steps

1. **Configure MySQL Database**: Set up database connection in Azure
2. **Custom Domain**: Configure your own domain
3. **SSL Certificate**: Set up HTTPS
4. **Monitoring**: Enable Application Insights
5. **Backup**: Set up automated backups
6. **Scaling**: Configure auto-scaling rules

Your NGO Kiosk application is now fully deployed and ready for production use! 🎉 