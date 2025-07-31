# Azure Deployment Guide for NGO Kiosk App

This guide provides step-by-step instructions to deploy your NGO Kiosk application to Azure App Service.

## Prerequisites

1. **Azure Account**: Active Azure subscription
2. **Azure CLI**: Installed and configured
3. **Node.js**: Version 18+ installed
4. **Git**: For version control

## Quick Deployment (Automated)

### Option 1: Using PowerShell Script

1. **Run the deployment script**:
   ```powershell
   .\azure-deploy-script.ps1
   ```

2. **Follow the prompts** to complete the deployment

### Option 2: Manual Deployment

## Step-by-Step Manual Deployment

### Step 1: Login to Azure

```bash
az login
```

This will open a browser window for authentication.

### Step 2: Set Variables

```bash
# Set your preferred values
RESOURCE_GROUP="ngo-kiosk-rg"
LOCATION="East US"
APP_NAME="ngo-kiosk-app"
PLAN_NAME="ngo-kiosk-plan"
SKU="B1"
```

### Step 3: Create Resource Group

```bash
az group create --name $RESOURCE_GROUP --location $LOCATION
```

### Step 4: Create App Service Plan

```bash
az appservice plan create \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku $SKU \
  --is-linux
```

### Step 5: Create Web App

```bash
az webapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan $PLAN_NAME \
  --runtime "NODE|18-lts"
```

### Step 6: Configure Environment Variables

```bash
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV=production \
    PORT=8080
```

### Step 7: Configure Startup Command

```bash
az webapp config set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --startup-file "node index.js"
```

### Step 8: Enable Local Git Deployment

```bash
az webapp deployment source config-local-git \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP
```

### Step 9: Deploy Your Application

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Initialize Git repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial deployment"
   ```

3. **Add Azure remote and deploy**:
   ```bash
   # Get the deployment URL
   DEPLOYMENT_URL=$(az webapp deployment source config-local-git --name $APP_NAME --resource-group $RESOURCE_GROUP --query url --output tsv)
   
   # Add Azure remote
   git remote add azure $DEPLOYMENT_URL
   
   # Deploy
   git push azure master
   ```

### Step 10: Verify Deployment

1. **Check deployment status**:
   ```bash
   az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query "state"
   ```

2. **Open your application**:
   ```bash
   az webapp browse --name $APP_NAME --resource-group $RESOURCE_GROUP
   ```

## Application URLs

After successful deployment, your application will be available at:
- **Main Application**: `https://{APP_NAME}.azurewebsites.net`
- **Azure Portal**: `https://portal.azure.com`

## Configuration Details

### Environment Variables

The following environment variables are configured:
- `NODE_ENV=production`: Sets the environment to production
- `PORT=8080`: Sets the port for the application

### Application Structure

Your deployed application includes:
- **Frontend**: React application (served from `/public` directory)
- **Backend**: Node.js Express server
- **Database**: SQLite database (included in the deployment)

## Post-Deployment Steps

### 1. Test Your Application

1. Visit your application URL
2. Test all major functionalities:
   - User registration
   - Check-in process
   - Admin panel
   - Raffle functionality

### 2. Configure Custom Domain (Optional)

```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --hostname "your-domain.com"
```

### 3. Set Up SSL Certificate

```bash
# Bind SSL certificate
az webapp config ssl bind \
  --certificate-thumbprint <thumbprint> \
  --ssl-type SNI \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP
```

### 4. Configure Monitoring

1. **Enable Application Insights**:
   ```bash
   az monitor app-insights component create \
     --app ngo-kiosk-insights \
     --location $LOCATION \
     --resource-group $RESOURCE_GROUP \
     --application-type web
   ```

2. **Connect to your web app**:
   ```bash
   az webapp config appsettings set \
     --name $APP_NAME \
     --resource-group $RESOURCE_GROUP \
     --settings \
       APPINSIGHTS_INSTRUMENTATIONKEY=<your-key>
   ```

## Troubleshooting

### Common Issues

1. **Deployment Fails**:
   - Check Azure CLI version: `az --version`
   - Verify login status: `az account show`
   - Check resource group exists: `az group show --name $RESOURCE_GROUP`

2. **Application Not Starting**:
   - Check logs: `az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP`
   - Verify startup command: `az webapp config show --name $APP_NAME --resource-group $RESOURCE_GROUP`

3. **Database Issues**:
   - Ensure SQLite database file is included in deployment
   - Check file permissions on Azure

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

## Cost Optimization

- **Development**: Use F1 (Free) tier for testing
- **Production**: Use B1 (Basic) tier for small workloads
- **Scaling**: Upgrade to S1 (Standard) for higher traffic

## Security Considerations

1. **Environment Variables**: Store sensitive data in Azure Key Vault
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure CORS settings appropriately
4. **Authentication**: Implement proper authentication for admin features

## Support

For Azure-specific issues:
- [Azure Documentation](https://docs.microsoft.com/azure/)
- [Azure Support](https://azure.microsoft.com/support/)

For application-specific issues:
- Check the application logs
- Review the codebase for configuration issues 