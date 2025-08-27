const cors = require('cors');

// CORS configuration for different environments
const corsOptions = {
  // Development environment
  development: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    exposedHeaders: ['Content-Length', 'X-Total-Count'],
    maxAge: 86400 // 24 hours
  },

  // Production environment
  production: {
    origin: [
      'https://ngo-kiosk-app-fmh6acaxd4czgyh4.centralus-01.azurewebsites.net',
      'https://app.indoamericanfair.com',
      'https://indoamericanfair.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    exposedHeaders: ['Content-Length', 'X-Total-Count'],
    maxAge: 86400 // 24 hours
  }
};

// Dynamic CORS configuration based on environment
function getCorsConfig() {
  const env = process.env.NODE_ENV || 'development';
  return corsOptions[env] || corsOptions.development;
}

// CORS middleware
const corsMiddleware = cors(getCorsConfig());

// Preflight handler
function handlePreflight(req, res, next) {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    res.status(200).end();
  } else {
    next();
  }
}

module.exports = {
  corsMiddleware,
  handlePreflight,
  getCorsConfig
};
