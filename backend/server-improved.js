// Load environment variables
require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');

// Import middleware and configurations
const { corsMiddleware, handlePreflight } = require('./middleware/cors');
const { errorHandler, notFoundHandler, asyncHandler } = require('./middleware/errorHandler');
const { sanitizeInput } = require('./middleware/validation');
const rateLimits = require('./middleware/rateLimit');
const { pool, testConnection, healthCheck } = require('./config/database');

// Import other required modules
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const multer = require('multer');
const bcrypt = require('bcryptjs');

const app = express();

// Trust proxy for Azure
app.set('trust proxy', 1);

// Apply middleware
app.use(corsMiddleware);
app.use(handlePreflight);
app.use(sanitizeInput);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting
app.use('/api/', rateLimits.general);
app.use('/api/login', rateLimits.auth);
app.use('/api/register', rateLimits.registration);
app.use('/api/mobile-register', rateLimits.registration);
app.use('/api/checkin', rateLimits.checkin);
app.use('/api/admin', rateLimits.admin);

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoints
app.get('/ping', (req, res) => {
  res.json({
    message: 'Server is responding!',
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

app.get('/health', async (req, res) => {
  const dbHealth = await healthCheck();
  res.status(200).json({
    status: 'OK',
    message: 'NGO Kiosk is running!',
    timestamp: new Date().toISOString(),
    database: dbHealth ? 'connected' : 'disconnected'
  });
});

// Root path - serve React app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve static files
app.use('/', express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Serve uploaded files
const UPLOAD_DIR_ENV = process.env.UPLOAD_DIR || '/home/site/uploads';
app.use('/uploads', express.static(UPLOAD_DIR_ENV));

// Set up file upload storage
const uploadDir = process.env.UPLOAD_DIR || '/home/site/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${originalName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 2 // Max 2 files per request
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Email configuration
const GMAIL_USER = process.env.GMAIL_USER?.trim();
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '').trim();

async function createEmailTransporter() {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.error('❌ Gmail credentials not found');
    return null;
  }

  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD
    },
    tls: { rejectUnauthorized: false },
    secure: true,
    port: 465
  });

  try {
    await transporter.verify();
    console.log('✅ Email transporter verified');
    return transporter;
  } catch (error) {
    console.error('❌ Email transporter verification failed:', error.message);
    return null;
  }
}

// Database initialization
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        totp_secret VARCHAR(255),
        admin_id VARCHAR(50) UNIQUE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Create events table with improved schema
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        start_datetime DATETIME NOT NULL,
        end_datetime DATETIME NOT NULL,
        location VARCHAR(500) NOT NULL,
        raffle_tickets VARCHAR(255) DEFAULT '',
        banner VARCHAR(500),
        header_image VARCHAR(500),
        footer_location VARCHAR(500),
        footer_phone VARCHAR(50),
        footer_email VARCHAR(255),
        volunteer_enabled BOOLEAN DEFAULT FALSE,
        welcome_text TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        modified_by INT,
        modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (modified_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Create registrations table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255) NOT NULL,
        event_id INT,
        event_name VARCHAR(255),
        event_date DATETIME,
        interested_to_volunteer BOOLEAN DEFAULT FALSE,
        checked_in BOOLEAN DEFAULT FALSE,
        checkin_date DATETIME,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
      )
    `);

    // Create raffle_winners table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS raffle_winners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        registration_id INT,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255) NOT NULL,
        event_name VARCHAR(255),
        win_date DATE,
        win_time TIME,
        won_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE SET NULL
      )
    `);

    connection.release();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// API Routes
// Note: In a production environment, these should be moved to separate route files

// Login endpoint
app.post('/api/login', rateLimits.auth, asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      message: "Username and password are required" 
    });
  }

  const [rows] = await pool.execute(
    "SELECT * FROM users WHERE username = ?",
    [username]
  );

  if (rows.length === 0) {
    return res.status(401).json({ 
      success: false, 
      message: "Invalid username or password" 
    });
  }

  const user = rows[0];
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    return res.status(401).json({ 
      success: false, 
      message: "Invalid username or password" 
    });
  }

  if (user.totp_secret) {
    res.json({
      success: true,
      mfa: 'totp',
      userId: user.id
    });
  } else {
    // Generate TOTP secret for first-time setup
    const crypto = require('crypto');
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += base32Chars[Math.floor(Math.random() * base32Chars.length)];
    }

    if (!global.totpEnrollment) global.totpEnrollment = new Map();
    global.totpEnrollment.set(user.id, {
      secret: secret,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      mfa: 'totp-enroll',
      userId: user.id,
      manualSecret: secret,
      label: `NGO Kiosk:${user.username}`
    });
  }
}));

// Get events
app.get('/api/events', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(`
    SELECT
      id as event_id,
      name,
      start_datetime,
      end_datetime,
      location,
      raffle_tickets,
      banner,
      header_image,
      footer_location,
      footer_phone,
      footer_email,
      volunteer_enabled,
      welcome_text,
      created_at,
      modified_at,
      (SELECT username FROM users WHERE id = events.created_by) as created_by_name,
      (SELECT username FROM users WHERE id = events.modified_by) as modified_by_name
    FROM events
    ORDER BY start_datetime DESC
  `);
  
  res.json(rows);
}));

// Get today's event
app.get('/api/todays-event', asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  const [rows] = await pool.execute(`
    SELECT
      id as event_id,
      name,
      start_datetime,
      end_datetime,
      location,
      raffle_tickets,
      banner,
      header_image,
      footer_location,
      footer_phone,
      footer_email,
      volunteer_enabled,
      welcome_text,
      created_at,
      modified_at,
      (SELECT username FROM users WHERE id = events.created_by) as created_by_name,
      (SELECT username FROM users WHERE id = events.modified_by) as modified_by_name
    FROM events
    WHERE DATE(start_datetime) <= ? AND DATE(end_datetime) >= ?
    ORDER BY start_datetime DESC
    LIMIT 1
  `, [today, today]);
  
  res.json(rows[0] || null);
}));

// Registration endpoint
app.post('/api/register', rateLimits.registration, asyncHandler(async (req, res) => {
  const { name, phone, email, eventId, interested_to_volunteer } = req.body;
  
  // Validate required fields
  if (!name || !phone || !email || !eventId) {
    return res.status(400).json({ 
      success: false, 
      message: "All fields are required" 
    });
  }

  // Get event details
  const [eventRows] = await pool.execute(
    "SELECT * FROM events WHERE id = ?",
    [eventId]
  );

  if (eventRows.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: "Event not found" 
    });
  }

  const event = eventRows[0];

  // Insert registration
  const [result] = await pool.execute(
    "INSERT INTO registrations (name, phone, email, event_id, event_name, event_date, interested_to_volunteer, checked_in, checkin_date, registered_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())",
    [name, phone, email, eventId, event.name, event.start_datetime, interested_to_volunteer]
  );

  const registrationId = result.insertId;

  // Send confirmation email
  const transporter = await createEmailTransporter();
  if (transporter) {
    try {
      const mailOptions = {
        from: GMAIL_USER,
        to: email,
        subject: `Registration Confirmed for ${event.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Registration Confirmed for ${event.name}</h2>
            <p>Hello ${name},</p>
            <p>You have successfully registered for <strong>${event.name}</strong>.</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3>Event Details:</h3>
              <p><strong>Date & Time:</strong> ${new Date(event.start_datetime).toLocaleString()}</p>
              <p><strong>Venue:</strong> ${event.location}</p>
              <p><strong>Registration ID:</strong> ${registrationId}</p>
            </div>
            <p>You have been automatically checked in for this event.</p>
            <p>Warm regards,<br><strong>${event.name} Team</strong></p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
    }
  }

  res.json({ 
    success: true, 
    message: "Registration successful", 
    registrationId: registrationId
  });
}));

// Check-in endpoint
app.post('/api/checkin', rateLimits.checkin, asyncHandler(async (req, res) => {
  const { phone, registrationId, eventId } = req.body;
  
  if (!phone && !registrationId) {
    return res.status(400).json({ 
      success: false, 
      message: "Phone number or registration ID required" 
    });
  }

  let query, params;
  
  if (registrationId) {
    query = "SELECT * FROM registrations WHERE id = ? AND checked_in = 0";
    params = [registrationId];
  } else {
    query = "SELECT * FROM registrations WHERE phone = ? AND checked_in = 0";
    params = [phone];
  }

  const [rows] = await pool.execute(query, params);

  if (rows.length === 0) {
    // Check if already checked in
    let existingQuery, existingParams;
    if (registrationId) {
      existingQuery = "SELECT * FROM registrations WHERE id = ?";
      existingParams = [registrationId];
    } else {
      existingQuery = "SELECT * FROM registrations WHERE phone = ?";
      existingParams = [phone];
    }

    const [existingRows] = await pool.execute(existingQuery, existingParams);

    if (existingRows.length > 0 && existingRows[0].checked_in) {
      return res.status(400).json({ 
        success: false, 
        message: `Welcome back ${existingRows[0].name}, you have already checked in`,
        error: "This QR code has already been scanned",
        name: existingRows[0].name
      });
    } else {
      return res.status(404).json({ 
        success: false, 
        message: "Registration not found",
        error: "Invalid QR code"
      });
    }
  }

  // Check event match if provided
  if (eventId && rows[0].event_id && Number(rows[0].event_id) !== Number(eventId)) {
    return res.status(400).json({
      success: false,
      message: 'QR not valid for selected event',
      error: `QR not valid for selected event. This QR belongs to "${rows[0].event_name}"`,
      eventName: rows[0].event_name,
      eventId: rows[0].event_id
    });
  }

  // Perform check-in
  await pool.execute(
    "UPDATE registrations SET checked_in = 1, checkin_date = NOW() WHERE id = ?",
    [rows[0].id]
  );

  res.json({ 
    success: true, 
    message: "Check-in successful", 
    name: rows[0].name 
  });
}));

// Handle React routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return notFoundHandler(req, res);
  }

  const filePath = path.join(__dirname, 'public', req.path);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize database and start server
const PORT = process.env.PORT || 8080;

async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }

    // Initialize database
    await initializeDatabase();

    // Start server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ Process ID: ${process.pid}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();
