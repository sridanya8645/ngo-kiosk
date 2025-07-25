#!/bin/bash
echo "Starting NGO Kiosk App deployment..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build React app
echo "Building React application..."
npm run build

# Copy build files to backend public directory
echo "Copying build files to backend..."
cp -r build/* backend/public/

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install

# Start the application
echo "Starting the application..."
node index.js 