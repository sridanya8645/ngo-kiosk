# NGO Kiosk Deployment Guide

## Quick Start (Local Network)

### Option 1: Development Mode (Easiest)
1. Double-click `start-app.bat` to start both servers
2. Find your computer's IP address by running `ipconfig` in Command Prompt
3. Look for "IPv4 Address" (usually starts with 192.168.x.x)
4. Access from iPad: `http://YOUR_IP_ADDRESS:3000`

### Option 2: Production Mode (Recommended for kiosk use)
1. Double-click `build-and-deploy.bat` to build and deploy
2. Find your computer's IP address by running `ipconfig` in Command Prompt
3. Access from iPad: `http://YOUR_IP_ADDRESS:5000`

## Manual Deployment Steps

### Prerequisites
- Node.js installed on your computer
- Both computers/iPads on the same WiFi network

### Step 1: Install Dependencies
```bash
npm install
cd backend
npm install
cd ..
```

### Step 2: Start the Application

#### For Development:
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
npm start
```

#### For Production:
```bash
# Build the React app
npm run build

# Copy build to backend
xcopy /E /I /Y "build" "backend\public"

# Start production server
cd backend
npm start
```

### Step 3: Access from Other Devices
1. Find your computer's IP address:
   - Windows: Run `ipconfig` in Command Prompt
   - Look for "IPv4 Address" (e.g., 192.168.1.100)

2. Access from iPad/other devices:
   - Development: `http://YOUR_IP_ADDRESS:3000`
   - Production: `http://YOUR_IP_ADDRESS:5000`

## Troubleshooting

### Can't access from other devices?
1. Check Windows Firewall - allow Node.js through firewall
2. Ensure both devices are on the same WiFi network
3. Try disabling Windows Defender temporarily for testing

### Port already in use?
- Change port in `backend/index.js` (line 225)
- Change port in `package.json` scripts

### Database issues?
- Ensure `users.db` file exists in backend folder
- Check file permissions

## Advanced Deployment Options

### Option 3: Cloud Deployment (Heroku, Vercel, etc.)
1. Build the React app: `npm run build`
2. Deploy backend to cloud platform
3. Configure environment variables
4. Access via cloud URL

### Option 4: Docker Deployment
1. Create Dockerfile
2. Build Docker image
3. Run container on server
4. Access via server IP

## Security Notes
- Change default passwords in database
- Use HTTPS in production
- Configure proper CORS settings
- Secure email credentials 