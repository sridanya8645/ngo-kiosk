# Railway Deployment Guide for NGO Kiosk App

## 🚀 Step-by-Step Railway Setup

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with your GitHub account
3. Create a new project

### Step 2: Add MySQL Database
1. Click "New Service" → "Database" → "MySQL"
2. Railway will automatically create a free MySQL database
3. Railway provides these environment variables automatically:
   - `MYSQLHOST` - Database host
   - `MYSQLUSER` - Database username
   - `MYSQLPASSWORD` - Database password
   - `MYSQLDATABASE` - Database name
   - `MYSQLPORT` - Database port

### Step 3: Deploy Your App
1. Click "New Service" → "GitHub Repo"
2. Connect your GitHub repository
3. Railway will automatically detect it's a Node.js app
4. Set the root directory to `backend` (since that's where your server.js is)

### Step 4: Configure Environment Variables
Railway will automatically connect your app to the MySQL database using the environment variables.

### Step 5: Deploy
1. Railway will automatically deploy when you push to GitHub
2. Your app will be available at: `https://your-app-name.railway.app`

## 📁 Project Structure for Railway

```
your-repo/
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── package.json
│   └── public/ (React build files)
├── src/ (React source)
├── public/ (React public files)
└── package.json (React package.json)
```

## 🔧 Railway Configuration

### Root Directory
Set the root directory to `backend` in Railway settings.

### Build Command
```bash
npm install && npm run build
```

### Start Command
```bash
npm start
```

## 🌐 Environment Variables

Railway automatically provides these for MySQL:
- `MYSQLHOST`
- `MYSQLUSER`
- `MYSQLPASSWORD`
- `MYSQLDATABASE`
- `MYSQLPORT`

## 📊 Benefits of Railway

✅ **Completely Free** - No monthly costs
✅ **Automatic Deployments** - Deploy on Git push
✅ **MySQL Database** - Free tier included
✅ **SSL Certificates** - Automatic HTTPS
✅ **Custom Domains** - Add your own domain
✅ **Easy Scaling** - Upgrade when needed

## 🎯 Cost Comparison

| Service | Database | Hosting | Monthly Cost |
|---------|----------|---------|--------------|
| **Railway** | MySQL | Railway | $0 |
| Azure | MySQL | App Service | $16+ |
| AWS | RDS | EB | $20+ |

## 🚀 Quick Deploy Commands

```bash
# 1. Push your code to GitHub
git add .
git commit -m "Ready for Railway deployment"
git push origin main

# 2. Railway will automatically deploy!
```

## 🔍 Troubleshooting

### Database Connection Issues
- Check Railway dashboard for environment variables
- Ensure MySQL service is running
- Verify database credentials

### Build Issues
- Check if `backend/package.json` exists
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### App Not Starting
- Check Railway logs in dashboard
- Verify `server.js` is the main file
- Ensure port is set correctly

## 📞 Support

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- GitHub Issues: Create issue in your repo

## 🎉 Success!

Once deployed, your app will be available at:
`https://your-app-name.railway.app`

All features will work:
- ✅ QR Code scanning on iPad Pro
- ✅ Banner uploads
- ✅ Registration system
- ✅ Admin panel
- ✅ Raffle system 