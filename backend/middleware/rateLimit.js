const rateLimit = require('express-rate-limit');

// Rate limit configurations optimized for high-volume public events (3000+ people)
const rateLimits = {
  // General API rate limit - increased for public event traffic
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased from 100 to 1000 requests per 15 minutes
    message: {
      error: 'Too many requests',
      message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Authentication rate limit (kept restrictive for security)
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Increased from 5 to 10 login attempts per 15 minutes
    message: {
      error: 'Too many login attempts',
      message: 'Too many login attempts from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Registration rate limit - significantly increased for public event
  registration: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // Increased from 10 to 100 registrations per hour per IP
    message: {
      error: 'Too many registrations',
      message: 'Too many registration attempts from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Check-in rate limit - increased for high-volume check-ins
  checkin: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 200, // Increased from 50 to 200 check-ins per 5 minutes
    message: {
      error: 'Too many check-ins',
      message: 'Too many check-in attempts from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Admin operations rate limit - kept moderate for admin security
  admin: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Increased from 30 to 50 admin operations per 15 minutes
    message: {
      error: 'Too many admin operations',
      message: 'Too many admin operations from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // New: Public event specific rate limit for high-volume scenarios
  publicEvent: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 500, // Allow 500 requests per hour for public event pages
    message: {
      error: 'High traffic detected',
      message: 'High traffic detected, please try again in a few minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  })
};

module.exports = rateLimits;
