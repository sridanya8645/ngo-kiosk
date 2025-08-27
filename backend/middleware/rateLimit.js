const rateLimit = require('express-rate-limit');

// Rate limit configurations
const rateLimits = {
  // General API rate limit
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests',
      message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Authentication rate limit (more restrictive)
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: {
      error: 'Too many login attempts',
      message: 'Too many login attempts from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Registration rate limit
  registration: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 registrations per hour
    message: {
      error: 'Too many registrations',
      message: 'Too many registration attempts from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Check-in rate limit
  checkin: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // Limit each IP to 50 check-ins per 5 minutes
    message: {
      error: 'Too many check-ins',
      message: 'Too many check-in attempts from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Admin operations rate limit
  admin: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each IP to 30 admin operations per windowMs
    message: {
      error: 'Too many admin operations',
      message: 'Too many admin operations from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  })
};

module.exports = rateLimits;
