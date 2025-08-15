#!/bin/bash

# Startup script for Azure App Service
echo "Starting NGO Kiosk Backend..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the application
echo "Starting application..."
npm start 