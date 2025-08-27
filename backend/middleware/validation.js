const Joi = require('joi');

// Validation schemas
const schemas = {
  // Event validation
  event: Joi.object({
    name: Joi.string().required().min(1).max(255).trim(),
    start_datetime: Joi.date().required(),
    end_datetime: Joi.date().greater(Joi.ref('start_datetime')).required(),
    location: Joi.string().required().min(1).max(500).trim(),
    raffle_tickets: Joi.string().optional().max(255),
    footer_location: Joi.string().optional().max(500),
    footer_phone: Joi.string().optional().max(50),
    footer_email: Joi.string().email().optional().max(255),
    volunteer_enabled: Joi.boolean().optional(),
    welcome_text: Joi.string().optional().max(1000),
    created_by: Joi.number().integer().positive().optional(),
    modified_by: Joi.number().integer().positive().optional()
  }),

  // Registration validation
  registration: Joi.object({
    name: Joi.string().required().min(1).max(255).trim(),
    phone: Joi.string().required().min(10).max(20).pattern(/^[\d\s\-\+\(\)]+$/),
    email: Joi.string().email().required().max(255),
    eventId: Joi.number().integer().positive().required(),
    interested_to_volunteer: Joi.boolean().optional()
  }),

  // Login validation
  login: Joi.object({
    username: Joi.string().required().min(1).max(255).trim(),
    password: Joi.string().required().min(1)
  }),

  // MFA validation
  mfa: Joi.object({
    userId: Joi.number().integer().positive().required(),
    token: Joi.string().required().length(6).pattern(/^\d{6}$/)
  }),

  // Admin user validation
  adminUser: Joi.object({
    username: Joi.string().required().min(1).max(255).trim(),
    password: Joi.string().required().min(8).max(255),
    admin_id: Joi.string().optional().max(50),
    is_active: Joi.boolean().optional()
  }),

  // Check-in validation
  checkin: Joi.object({
    phone: Joi.string().optional().min(10).max(20),
    registrationId: Joi.number().integer().positive().optional(),
    eventId: Joi.number().integer().positive().optional()
  }).or('phone', 'registrationId')
};

// Validation middleware factory
function validate(schemaName) {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return res.status(500).json({ error: 'Invalid validation schema' });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errorDetails
      });
    }

    // Replace request body with validated data
    req.body = value;
    next();
  };
}

// Sanitize input middleware
function sanitizeInput(req, res, next) {
  // Sanitize string inputs
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  };

  // Recursively sanitize object
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = typeof value === 'string' ? sanitizeString(value) : sanitizeObject(value);
    }
    return sanitized;
  };

  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);
  
  next();
}

module.exports = {
  validate,
  sanitizeInput,
  schemas
};
