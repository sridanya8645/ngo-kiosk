// Load environment variables
require('dotenv').config();

// Import middleware and configurations
const { corsMiddleware, handlePreflight } = require('./middleware/cors');
const { errorHandler, notFoundHandler, asyncHandler } = require('./middleware/errorHandler');
const { sanitizeInput, validate } = require('./middleware/validation');
const rateLimits = require('./middleware/rateLimit');
const { pool, testConnection, healthCheck } = require('./config/database');
const { initializeDatabase } = require('./db');

// Import other required modules
const express = require('express');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

// Apply public event rate limit to main pages for high-volume traffic
app.use('/', rateLimits.publicEvent);

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Simple test endpoint - FIRST THING
app.get('/ping', (req, res) => {
  console.log('Ping endpoint hit!');
  res.json({
    message: 'Server is responding!',
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// Health check for Azure
app.get('/health', async (req, res) => {
  console.log('Health check hit!');
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
  console.log('Serving React app for root path');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Azure App Service configuration
app.set('trust proxy', 1);



// Email configuration helpers
const RAW_GMAIL_USER = process.env.GMAIL_USER ?? '';
const RAW_GMAIL_PASS = process.env.GMAIL_APP_PASSWORD ?? '';
const GMAIL_USER = RAW_GMAIL_USER.trim();
// App passwords are 16 chars without spaces; strip spaces just in case they were pasted with spaces
const GMAIL_APP_PASSWORD = RAW_GMAIL_PASS.replace(/\s+/g, '').trim();

async function createVerifiedTransporter(preferred) {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.error('❌ Gmail credentials not found. Ensure GMAIL_USER and GMAIL_APP_PASSWORD are set.');
  } else {
    const masked = `${GMAIL_USER.substring(0,3)}***@***:${GMAIL_APP_PASSWORD.substring(0,2)}********`;
    console.log('🔐 Using Gmail credentials (masked):', masked);
  }

  const common = {
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    authMethod: 'PLAIN',
    tls: { rejectUnauthorized: false },
    pool: true,
    maxConnections: 1,
    maxMessages: 50,
    debug: true,
    logger: true
  };

  // Try SSL:465 first (preferred), fall back to STARTTLS:587
  const candidates = preferred === 'ssl'
    ? [
        { service: 'gmail', secure: true, port: 465 },
        { host: 'smtp.gmail.com', secure: false, port: 587, requireTLS: true }
      ]
    : [
        { host: 'smtp.gmail.com', secure: false, port: 587, requireTLS: true },
        { service: 'gmail', secure: true, port: 465 }
      ];

  let lastError;
  for (const cfg of candidates) {
    try {
      const transporter = nodemailer.createTransport({ ...cfg, ...common });
      await transporter.verify();
      console.log(`✅ Email transporter verified on ${cfg.secure ? 'SSL:465' : 'TLS:587'}`);
      return transporter;
    } catch (err) {
      lastError = err;
      console.error('❌ Transport verify failed:', cfg, err?.message);
    }
  }
  throw lastError;
}

// Serve static files from React build with proper MIME types
app.use('/', express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Serve uploaded files
// Use a writable path in App Service so this works with Run From Package
const UPLOAD_DIR_ENV = process.env.UPLOAD_DIR || '/home/site/uploads';
app.use('/uploads', express.static(UPLOAD_DIR_ENV));

// Explicit routes for static files
app.get('/static/js/*', (req, res) => {
  const filePath = path.join(__dirname, 'public', req.path);
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(filePath);
});

app.get('/static/css/*', (req, res) => {
  const filePath = path.join(__dirname, 'public', req.path);
  res.setHeader('Content-Type', 'text/css');
  res.sendFile(filePath);
});

// Set up storage for banner images
const uploadDir = process.env.UPLOAD_DIR || '/home/site/uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Initialize database on startup with delay and error handling
setTimeout(() => {
  initializeDatabase()
    .then(() => {
      console.log('✅ Database initialized successfully');
    })
    .catch((error) => {
      console.error('❌ Database initialization failed:', error);
      console.log('⚠️ Server will continue running without database initialization');
    });
}, 2000); // Wait 2 seconds before initializing database

// Login endpoint
app.post('/api/login', validate('login'), async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt for username:', username);
    
    // First get user by username only (without password for security)
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    
    console.log('Database query result:', rows.length, 'rows found');
    if (rows.length > 0) {
      const user = rows[0];
      
      // Verify password using bcrypt
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ success: false, message: "Invalid username or password" });
      }
      
      // Check if user already has TOTP set up
      if (user.totp_secret) {
        // User already has MFA set up, prompt for TOTP code
        console.log('User has existing TOTP, prompting for code:', user.id);
        res.json({
          success: true,
          mfa: 'totp',
          userId: user.id
        });
      } else {
        // First time setup - generate new TOTP secret for enrollment
        console.log('First time TOTP enrollment for user:', user.id);
        
        const crypto = require('crypto');
        // Generate a proper base32 secret for TOTP - authenticator app compatible
        const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        for (let i = 0; i < 32; i++) {
          secret += base32Chars[Math.floor(Math.random() * base32Chars.length)];
        }
        const label = user.username; // Use the user's email as label
        const issuer = 'NGO Kiosk';
        
        // Store the secret temporarily for enrollment
        if (!global.totpEnrollment) global.totpEnrollment = new Map();
        global.totpEnrollment.set(user.id, {
          secret: secret,
          timestamp: Date.now(),
          userEmail: user.username // Store user's email for sending MFA codes
        });
        
        // Send TOTP secret to user's email
        try {
          const transporter = await createVerifiedTransporter('ssl');
          const mailOptions = {
            from: GMAIL_USER,
            to: user.username, // Send to user's email
            subject: 'NGO Kiosk - MFA Setup Required',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">🔐 MFA Setup Required</h2>
                <p>Hello,</p>
                <p>You have been granted admin access to the NGO Kiosk system. To complete your setup, please use the following secret key in your authenticator app:</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; border: 2px solid #ddd;">
                  <h3 style="margin-top: 0; color: #333;">Your Secret Key:</h3>
                  <p style="font-family: monospace; font-size: 18px; background: #fff; padding: 15px; border-radius: 5px; border: 1px solid #ccc; margin: 10px 0;">
                    <strong>${secret}</strong>
                  </p>
                  <p style="font-size: 14px; color: #666; margin: 10px 0;">
                    <strong>Account:</strong> ${issuer}:${label}
                  </p>
                </div>
                
                <p><strong>Instructions:</strong></p>
                <ol>
                  <li>Open your authenticator app (Google Authenticator, Authy, etc.)</li>
                  <li>Add a new account</li>
                  <li>Enter the secret key above</li>
                  <li>Return to the login page and enter the 6-digit code</li>
                </ol>
                
                <p style="color: #666; font-size: 14px;">This secret key is for your account only. Keep it secure and do not share it with others.</p>
                
                <p>Best regards,<br><strong>NGO Kiosk Team</strong></p>
              </div>
            `
          };
          
          await transporter.sendMail(mailOptions);
          console.log('✅ MFA setup email sent to:', user.username);
        } catch (emailError) {
          console.error('❌ Failed to send MFA setup email:', emailError);
          // Continue with setup even if email fails
        }
        
        res.json({
          success: true,
          mfa: 'totp-enroll',
          userId: user.id,
          manualSecret: secret,
          label: `${issuer}:${label}`
        });
      }
    } else {
      res.status(401).json({ success: false, message: "Invalid username or password" });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// MFA verification endpoint
app.post('/api/verify-mfa', validate('mfa'), async (req, res) => {
  try {
    const { userId, code } = req.body;
    
    if (!global.mfaCodes || !global.mfaCodes.has(userId)) {
      return res.status(400).json({ success: false, message: "No verification code found. Please try logging in again." });
    }
    
    const mfaData = global.mfaCodes.get(userId);
    const now = Date.now();
    const codeAge = now - mfaData.timestamp;
    const maxAge = 10 * 60 * 1000; // 10 minutes
    
    // Check if code is expired
    if (codeAge > maxAge) {
      global.mfaCodes.delete(userId);
      return res.status(400).json({ success: false, message: "Verification code has expired. Please try logging in again." });
    }
    
    // Check if too many attempts
    if (mfaData.attempts >= 3) {
      global.mfaCodes.delete(userId);
      return res.status(400).json({ success: false, message: "Too many failed attempts. Please try logging in again." });
    }
    
    // Increment attempts
    mfaData.attempts++;
    
    // Verify the code
    if (code === mfaData.code) {
      // Success! Remove the code and allow login
      global.mfaCodes.delete(userId);
      res.json({ success: true });
    } else {
      // Wrong code
      if (mfaData.attempts >= 3) {
        global.mfaCodes.delete(userId);
        return res.status(400).json({ success: false, message: "Too many failed attempts. Please try logging in again." });
      }
      res.status(400).json({ success: false, message: "Invalid verification code. Please try again." });
    }
  } catch (error) {
    console.error('MFA verification error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Base32 decoding function for TOTP
function base32Decode(str) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = [];
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i].toUpperCase();
    const index = alphabet.indexOf(char);
    if (index === -1) continue;
    
    value = (value << 5) | index;
    bits += 5;
    
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xFF);
      bits -= 8;
    }
  }
  
  return Buffer.from(output);
}

// TOTP MFA endpoints
app.post('/api/mfa/totp/login', validate('mfa'), async (req, res) => {
  try {
    const { userId, token } = req.body;
    
    // Get user's TOTP secret
    const [rows] = await pool.execute(
      "SELECT totp_secret FROM users WHERE id = ?",
      [userId]
    );
    
    if (rows.length === 0 || !rows[0].totp_secret) {
      return res.status(400).json({ success: false, message: "TOTP not set up" });
    }
    
    // Validate TOTP token
    const crypto = require('crypto');
    const secret = rows[0].totp_secret;
    const time = Math.floor(Date.now() / 30000); // 30-second window
    
    // Generate expected tokens for current and adjacent time windows
    const expectedTokens = [];
    for (let i = -1; i <= 1; i++) {
      const timeBuffer = Buffer.alloc(8);
      timeBuffer.writeBigUInt64BE(BigInt(time + i), 0);
      
      const hmac = crypto.createHmac('sha1', base32Decode(secret));
      hmac.update(timeBuffer);
      const hash = hmac.digest();
      
      const offset = hash[hash.length - 1] & 0xf;
      const code = ((hash[offset] & 0x7f) << 24) |
                   ((hash[offset + 1] & 0xff) << 16) |
                   ((hash[offset + 2] & 0xff) << 8) |
                   (hash[offset + 3] & 0xff);
      
      expectedTokens.push((code % 1000000).toString().padStart(6, '0'));
    }
    
    if (expectedTokens.includes(token)) {
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: "Invalid code" });
    }
  } catch (error) {
    console.error('TOTP login error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post('/api/mfa/totp/verify', validate('mfa'), async (req, res) => {
  try {
    const { userId, token } = req.body;
    
    // Get enrollment secret
    if (!global.totpEnrollment || !global.totpEnrollment.has(userId)) {
      return res.status(400).json({ success: false, message: "Enrollment expired" });
    }
    
    const enrollment = global.totpEnrollment.get(userId);
    const secret = enrollment.secret;
    
    // Validate TOTP token
    const crypto = require('crypto');
    const time = Math.floor(Date.now() / 30000); // 30-second window
    
    // Generate expected tokens for current and adjacent time windows
    const expectedTokens = [];
    for (let i = -1; i <= 1; i++) {
      const timeBuffer = Buffer.alloc(8);
      timeBuffer.writeBigUInt64BE(BigInt(time + i), 0);
      
      const hmac = crypto.createHmac('sha1', base32Decode(secret));
      hmac.update(timeBuffer);
      const hash = hmac.digest();
      
      const offset = hash[hash.length - 1] & 0xf;
      const code = ((hash[offset] & 0x7f) << 24) |
                   ((hash[offset + 1] & 0xff) << 16) |
                   ((hash[offset + 2] & 0xff) << 8) |
                   (hash[offset + 3] & 0xff);
      
      expectedTokens.push((code % 1000000).toString().padStart(6, '0'));
    }
    
    if (expectedTokens.includes(token)) {
      // Store the secret in database
      await pool.execute(
        "UPDATE users SET totp_secret = ? WHERE id = ?",
        [secret, userId]
      );
      
      // Send confirmation email to user
      try {
        const userEmail = enrollment.userEmail;
        const transporter = await createVerifiedTransporter('ssl');
        const mailOptions = {
          from: GMAIL_USER,
          to: userEmail,
          subject: 'NGO Kiosk - MFA Setup Complete',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #28a745;">✅ MFA Setup Complete</h2>
              <p>Hello,</p>
              <p>Your Multi-Factor Authentication (MFA) setup has been completed successfully!</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; border: 2px solid #28a745;">
                <h3 style="margin-top: 0; color: #28a745;">Setup Confirmed</h3>
                <p>Your authenticator app is now configured and you can log in to the NGO Kiosk admin panel using your 6-digit codes.</p>
              </div>
              
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>You can now log in to the admin panel</li>
                <li>Use your 6-digit authenticator codes for future logins</li>
                <li>Keep your authenticator app secure</li>
              </ul>
              
              <p style="color: #666; font-size: 14px;">If you did not complete this setup, please contact the system administrator immediately.</p>
              
              <p>Best regards,<br><strong>NGO Kiosk Team</strong></p>
            </div>
          `
        };
        
        await transporter.sendMail(mailOptions);
        console.log('✅ MFA setup confirmation email sent to:', userEmail);
      } catch (emailError) {
        console.error('❌ Failed to send MFA confirmation email:', emailError);
        // Continue even if email fails
      }
      
      // Clean up enrollment
      global.totpEnrollment.delete(userId);
      
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: "Invalid code" });
    }
  } catch (error) {
    console.error('TOTP verify error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Register endpoint
app.post('/api/register', validate('registration'), async (req, res) => {
  try {
    console.log("Register endpoint hit");
    const { name, phone, email, eventId, interested_to_volunteer } = req.body;
    
    // Get event details
    const [eventRows] = await pool.execute(
      "SELECT * FROM events WHERE id = ?",
      [eventId]
    );
    
    if (eventRows.length === 0) {
      return res.status(400).json({ success: false, message: "Event not found" });
    }
    
    const event = eventRows[0];
    
    // Insert registration with checked_in = 1 and checkin_date = NOW() for regular register
    const registrationTime = new Date();
    const [result] = await pool.execute(
      "INSERT INTO registrations (name, phone, email, event_id, event_name, event_date, interested_to_volunteer, checked_in, checkin_date, registered_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())",
      [name, phone, email, eventId, event.name, event.start_datetime, interested_to_volunteer]
    );
    
    const registrationId = result.insertId;
    
    // Send confirmation email without QR code for regular register
    try {
      console.log('🔍 Attempting to send email to:', email);
      
      if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
        console.error('❌ Gmail credentials not configured. Skipping email send.');
        // Still return success but without email
        return res.json({ 
          success: true, 
          message: "Registration successful! You have been automatically checked in. Email credentials not configured.",
          registrationId: registrationId
        });
      }
      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: GMAIL_USER,
          pass: GMAIL_APP_PASSWORD
        },
        tls: { rejectUnauthorized: false },
        secure: true,
        port: 465,
        debug: true,
        logger: true
      });
      console.log('🔍 Testing email transporter connection...');
      await transporter.verify();
      console.log('✅ Email transporter verified successfully');
      
      const mailOptions = {
        from: GMAIL_USER,
        to: email,
        subject: `Registration Confirmed for ${event.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="color: #28a745; font-size: 24px;">✓</span>
              <h2 style="color: #333; margin: 10px 0;">Registration Confirmed for ${event.name}</h2>
            </div>
            
            <p style="font-size: 16px; color: #333;">Hello ${name},</p>
            
            <p style="font-size: 16px; color: #333;">You have successfully registered for <strong>${event.name}</strong>.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Event Details:</h3>
              <p style="margin: 8px 0;"><span style="color: #666;">📅</span> <strong>Date & Time:</strong> ${new Date(event.start_datetime).toLocaleDateString()} ${event.end_datetime && new Date(event.end_datetime).toDateString() !== new Date(event.start_datetime).toDateString() ? `to ${new Date(event.end_datetime).toLocaleDateString()}` : ''} at ${new Date(event.start_datetime).toLocaleTimeString()}</p>
              <p style="margin: 8px 0;"><span style="color: #666;">📍</span> <strong>Venue:</strong> ${event.location}</p>
              <p style="margin: 8px 0;"><span style="color: #666;">🆔</span> <strong>Registration ID:</strong> ${registrationId}</p>
              <p style="margin: 8px 0;"><span style="color: #666;">⏰</span> <strong>Registration Time:</strong> ${registrationTime.toLocaleString("en-US", {timeZone: "America/New_York"})}</p>
            </div>
            
            <p style="font-size: 16px; color: #333;">You have been automatically checked in for this event. We look forward to welcoming you!</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 15px 0; border: 2px solid #ddd;">
                <p style="font-size: 16px; color: #333; margin: 0 0 15px 0; font-weight: bold;">📱 <strong>Registration ID:</strong> ${registrationId}</p>
                <p style="font-size: 14px; color: #666; margin: 5px 0; font-family: monospace;">Event: ${event.name}</p>
                <p style="font-size: 14px; color: #666; margin: 5px 0; font-family: monospace;">Date & Time: ${new Date(event.start_datetime).toLocaleDateString()} ${event.end_datetime && new Date(event.end_datetime).toDateString() !== new Date(event.start_datetime).toDateString() ? `to ${new Date(event.end_datetime).toLocaleDateString()}` : ''} at ${new Date(event.start_datetime).toLocaleTimeString()}</p>
                <p style="font-size: 12px; color: #999; margin: 10px 0 0 0;">You are automatically checked in</p>
              </div>
            </div>
            
            <p style="font-size: 16px; color: #333;">Warm regards,<br><strong>${event.welcome_text ? (event.welcome_text.includes('Welcome to ') ? event.welcome_text.replace('Welcome to ', '') : event.welcome_text) : event.name} Team</strong></p>
            
            <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px;">
              <p style="margin: 5px 0;"><span style="color: #666;">🌐</span> <a href="https://www.indoamericanfair.com/" style="color: #8B1C1C;">https://www.indoamericanfair.com/</a></p>
              <p style="margin: 5px 0;"><span style="color: #666;">📧</span> <a href="mailto:${event.footer_email || 'Indoamericanexpo@gmail.com'}" style="color: #8B1C1C;">${event.footer_email || 'Indoamericanexpo@gmail.com'}</a></p>
              <p style="margin: 5px 0;"><span style="color: #666;">📞</span> <a href="tel:${event.footer_phone || '609-937-2800'}" style="color: #8B1C1C;">${event.footer_phone || '609-937-2800'}</a></p>
            </div>
          </div>
        `
      };
      
      console.log('📧 Sending email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });
      
      await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully to:', email);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      console.error('Email error details:', {
        message: emailError.message,
        code: emailError.code,
        command: emailError.command,
        response: emailError.response
      });
      // Don't fail the registration if email fails
    }
    
    res.json({ 
      success: true, 
      message: "Registration successful", 
      registrationId: registrationId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

// Mobile register endpoint
app.post('/api/mobile-register', validate('registration'), async (req, res) => {
  try {
    console.log("Mobile register endpoint hit");
    const { name, phone, email, eventId, interested_to_volunteer } = req.body;
    
    // Get event details
    const [eventRows] = await pool.execute(
      "SELECT * FROM events WHERE id = ?",
      [eventId]
    );
    
    if (eventRows.length === 0) {
      return res.status(400).json({ success: false, message: "Event not found" });
    }
    
    const event = eventRows[0];
    
    // Insert registration with checked_in = 1 and checkin_date = NOW() for mobile register (automatic check-in)
    const registrationTime = new Date();
    const [result] = await pool.execute(
      "INSERT INTO registrations (name, phone, email, event_id, event_name, event_date, interested_to_volunteer, checked_in, checkin_date, registered_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())",
      [name, phone, email, eventId, event.name, event.start_datetime, interested_to_volunteer]
    );
    
    const registrationId = result.insertId;
    
    // Send confirmation email without QR code for mobile register (automatic check-in)
    try {
      console.log('🔍 Attempting to send email to:', email);all
      
      if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
        console.error('❌ Gmail credentials not configured. Skipping email send.');
        // Still return success but without email
        return res.json({ 
          success: true, 
          message: "Registration successful! You have been automatically checked in. Email credentials not configured.",
          registrationId: registrationId
        });
      }
      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: GMAIL_USER,
          pass: GMAIL_APP_PASSWORD
        },
        tls: { rejectUnauthorized: false },
        secure: true,
        port: 465,
        debug: true,
        logger: true
      });
      console.log('🔍 Testing email transporter connection...');
      await transporter.verify();
      console.log('✅ Email transporter verified successfully');
      
      const mailOptions = {
        from: GMAIL_USER,
        to: email,
        subject: `Registration Confirmed for ${event.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="color: #28a745; font-size: 24px;">✓</span>
              <h2 style="color: #333; margin: 10px 0;">Registration Confirmed for ${event.name}</h2>
            </div>
            
            <p style="font-size: 16px; color: #333;">Hello ${name},</p>
            
            <p style="font-size: 16px; color: #333;">You have successfully registered for <strong>${event.name}</strong>.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Event Details:</h3>
              <p style="margin: 8px 0;"><span style="color: #666;">📅</span> <strong>Date & Time:</strong> ${new Date(event.start_datetime).toLocaleDateString()} ${event.end_datetime && new Date(event.end_datetime).toDateString() !== new Date(event.start_datetime).toDateString() ? `to ${new Date(event.end_datetime).toLocaleDateString()}` : ''} at ${new Date(event.start_datetime).toLocaleTimeString()}</p>
              <p style="margin: 8px 0;"><span style="color: #666;">📍</span> <strong>Venue:</strong> ${event.location}</p>
              <p style="margin: 8px 0;"><span style="color: #666;">🆔</span> <strong>Registration ID:</strong> ${registrationId}</p>
              <p style="margin: 8px 0;"><span style="color: #666;">⏰</span> <strong>Registration Time:</strong> ${registrationTime.toLocaleString("en-US", {timeZone: "America/New_York"})}</p>
            </div>
            
            <p style="font-size: 16px; color: #333;">You have been automatically checked in for this event. We look forward to welcoming you!</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 15px 0; border: 2px solid #ddd;">
                <p style="font-size: 16px; color: #333; margin: 0 0 15px 0; font-weight: bold;">📱 <strong>Registration ID:</strong> ${registrationId}</p>
                <p style="font-size: 14px; color: #666; margin: 5px 0; font-family: monospace;">Event: ${event.name}</p>
                <p style="font-size: 14px; color: #666; margin: 5px 0; font-family: monospace;">Date & Time: ${new Date(event.start_datetime).toLocaleDateString()} ${event.end_datetime && new Date(event.end_datetime).toDateString() !== new Date(event.start_datetime).toDateString() ? `to ${new Date(event.end_datetime).toLocaleDateString()}` : ''} at ${new Date(event.start_datetime).toLocaleTimeString()}</p>
                <p style="font-size: 12px; color: #999; margin: 10px 0 0 0;">You are automatically checked in</p>
              </div>
            </div>
            
            <p style="font-size: 16px; color: #333;">Warm regards,<br><strong>${event.welcome_text ? (event.welcome_text.includes('Welcome to ') ? event.welcome_text.replace('Welcome to ', '') : event.welcome_text) : event.name} Team</strong></p>
            
            <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px;">
              <p style="margin: 5px 0;"><span style="color: #666;">🌐</span> <a href="https://www.indoamericanfair.com/" style="color: #8B1C1C;">https://www.indoamericanfair.com/</a></p>
              <p style="margin: 5px 0;"><span style="color: #666;">📧</span> <a href="mailto:${event.footer_email || 'Indoamericanexpo@gmail.com'}" style="color: #8B1C1C;">${event.footer_email || 'Indoamericanexpo@gmail.com'}</a></p>
              <p style="margin: 5px 0;"><span style="color: #666;">📞</span> <a href="tel:${event.footer_phone || '609-937-2800'}" style="color: #8B1C1C;">${event.footer_phone || '609-937-2800'}</a></p>
            </div>
          </div>
        `
      };
      
      console.log('📧 Sending email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });
      
      await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully to:', email);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      console.error('Email error details:', {
        message: emailError.message,
        code: emailError.code,
        command: emailError.command,
        response: emailError.response
      });
      // Don't fail the registration if email fails
    }
    
    res.json({ 
      success: true, 
      message: "Registration successful", 
      registrationId: registrationId
    });
  } catch (error) {
    console.error('Mobile registration error:', error);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test connection
    const connection = await pool.getConnection();
    console.log('✅ Database connection successful');
    
    // Test if tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('Tables found:', tables.map(t => Object.values(t)[0]));
    
    // Test events table
    const [events] = await connection.execute('SELECT COUNT(*) as count FROM events');
    console.log('Events count:', events[0].count);
    
    // Test banner files
    const [bannerEvents] = await connection.execute('SELECT id, name, banner FROM events WHERE banner IS NOT NULL');
    console.log('Events with banners:', bannerEvents);
    
    connection.release();
    
    res.json({ 
      success: true, 
      tables: tables.map(t => Object.values(t)[0]),
      eventsCount: events[0].count,
      bannerEvents: bannerEvents
    });
  } catch (error) {
    console.error('❌ Database test failed:', error);
    res.status(500).json({ 
      error: "Database test failed", 
      details: error.message,
      stack: error.stack
    });
  }
});

// Fix table structures endpoint
app.post('/api/fix-table-structures', async (req, res) => {
  try {
    console.log('🔄 Starting table structure fixes...');
    
    // Import the fix function
    const { fixTableStructures } = require('./fix-table-structures');
    
    // Run the migration
    await fixTableStructures();
    
    console.log('✅ Table structure fixes completed');
    res.json({ 
      success: true, 
      message: 'Table structures fixed successfully',
      details: {
        events: 'Updated with proper datetime fields, audit trails, and VARCHAR raffle_tickets',
        raffle_winners: 'Added prize column and improved foreign key constraints'
      }
    });
  } catch (error) {
    console.error('❌ Error fixing table structures:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fix table structures',
      error: error.message 
    });
  }
});

// Fix raffle column endpoint
app.get('/api/fix-raffle-column', async (req, res) => {
  try {
    console.log('🔧 Fixing raffle_tickets column...');

    // First check the current column type
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'events' AND COLUMN_NAME = 'raffle_tickets'
    `, [process.env.DB_NAME]);

    console.log('Current raffle_tickets column info:', columns[0]);

    if (columns.length > 0 && columns[0].DATA_TYPE === 'int') {
      // Change raffle_tickets from INT to VARCHAR(255)
      await pool.execute(`
        ALTER TABLE events
        MODIFY COLUMN raffle_tickets VARCHAR(255) DEFAULT ''
      `);

      console.log('✅ Raffle column updated to VARCHAR(255)');

      // Update existing records to have empty string instead of 0
      await pool.execute(`
        UPDATE events
        SET raffle_tickets = ''
        WHERE raffle_tickets = '0' OR raffle_tickets IS NULL
      `);

      console.log('✅ Existing raffle values updated');
      
      res.json({ 
        success: true, 
        message: "Raffle column fixed successfully",
        oldType: columns[0].DATA_TYPE,
        newType: 'varchar'
      });
    } else {
      console.log('✅ Raffle column is already VARCHAR or doesn\'t exist');
      res.json({ 
        success: true, 
        message: "Raffle column is already VARCHAR",
        currentType: columns[0]?.DATA_TYPE || 'not found'
      });
    }

  } catch (error) {
    console.error('❌ Error fixing raffle column:', error);
    res.status(500).json({ 
      error: "Failed to fix raffle column", 
      details: error.message
    });
  }
});

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    console.log('🔍 Fetching events from database...');
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
    console.log(`✅ Found ${rows.length} events`);
    
    res.json(rows);
  } catch (error) {
    console.error('❌ Get events error:', error);
    res.status(500).json({ error: "Failed to fetch events", details: error.message });
  }
});

// Helper function to convert 12-hour time to 24-hour format
function convertTo24Hour(timeStr) {
  if (!timeStr) return null;
  
  // If already in 24-hour format, return as is
  if (timeStr.includes(':')) {
    const parts = timeStr.split(':');
    if (parts.length === 2 && !timeStr.toLowerCase().includes('am') && !timeStr.toLowerCase().includes('pm')) {
      return timeStr + ':00';
    }
  }
  
  // Convert 12-hour format to 24-hour
  const time = new Date(`2000-01-01 ${timeStr}`);
  if (isNaN(time.getTime())) {
    return null; // Invalid time format
  }
  return time.toTimeString().slice(0, 8); // Returns HH:MM:SS
}

// Add event
app.post('/api/events', upload.fields([
  { name: 'banner', maxCount: 1 },
  { name: 'header_image', maxCount: 1 }
]), validate('event'), async (req, res) => {
  try {
         const { name, start_datetime, end_datetime, location, raffle_tickets, footer_location, footer_phone, footer_email, volunteer_enabled, welcome_text, created_by } = req.body;
    
    // Generate unique banner filename with event name
    let banner = null;
    if (req.files && req.files.banner) {
      const eventNameSlug = name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const timestamp = Date.now();
      const fileExtension = req.files.banner[0].originalname.split('.').pop();
      const newFilename = `banner_${eventNameSlug}_${timestamp}.${fileExtension}`;
      
      // Rename the uploaded file
      const oldPath = req.files.banner[0].path;
      const newPath = path.join(uploadDir, newFilename);
      fs.renameSync(oldPath, newPath);
      
      banner = `/uploads/${newFilename}`;
      console.log(`Banner uploaded: ${banner}`);
    }
    
    // Generate unique header image filename with event name
    let header_image = null;
    if (req.files && req.files.header_image) {
      const eventNameSlug = name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const timestamp = Date.now();
      const fileExtension = req.files.header_image[0].originalname.split('.').pop();
      const newFilename = `header_${eventNameSlug}_${timestamp}.${fileExtension}`;
      
      // Rename the uploaded file
      const oldPath = req.files.header_image[0].path;
      const newPath = path.join(uploadDir, newFilename);
      fs.renameSync(oldPath, newPath);
      
      header_image = `/uploads/${newFilename}`;
      console.log(`Header image uploaded: ${header_image}`);
    }

    // Convert datetime strings to MySQL format - Store as UTC but display in EST
    const formatDateTime = (dateTimeStr) => {
      if (!dateTimeStr) return null;
      try {
        // Parse the datetime string and store as UTC
        const date = new Date(dateTimeStr);
        return date.toISOString().slice(0, 19).replace('T', ' ');
      } catch (error) {
        console.error('Error formatting datetime:', dateTimeStr, error);
        return dateTimeStr;
      }
    };
    
    const formattedStartDateTime = formatDateTime(start_datetime);
    const formattedEndDateTime = formatDateTime(end_datetime);
    
    // Convert volunteer_enabled to proper boolean
    const volunteerEnabled = volunteer_enabled === 'true' || volunteer_enabled === true ? 1 : 0;
    
    // Validate created_by - ensure it's a valid number or null
    const validCreatedBy = (created_by && created_by !== 'undefined' && !isNaN(created_by)) ? parseInt(created_by) : null;
    
                 const [result] = await pool.execute(
          'INSERT INTO events (name, start_datetime, end_datetime, location, banner, header_image, raffle_tickets, footer_location, footer_phone, footer_email, volunteer_enabled, welcome_text, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [name, formattedStartDateTime, formattedEndDateTime, location, banner, header_image, raffle_tickets || '', footer_location || null, footer_phone || null, footer_email || null, volunteerEnabled, welcome_text || null, validCreatedBy]
        );
    
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
         FROM events WHERE id = ?
       `, [result.insertId]);
    
    res.json({ success: true, event: rows[0] });
  } catch (error) {
    console.error('Add event error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Edit event
app.put('/api/events/:id', upload.fields([
  { name: 'banner', maxCount: 1 },
  { name: 'header_image', maxCount: 1 }
]), validate('event'), async (req, res) => {
  try {
         const { name, start_datetime, end_datetime, location, raffle_tickets, footer_location, footer_phone, footer_email, volunteer_enabled, welcome_text, modified_by } = req.body;
    const { id } = req.params;
    
    console.log('Edit event request:', { id, name, start_datetime, end_datetime, location, raffle_tickets });
    
    // Convert datetime strings to MySQL format - Store as UTC but display in EST
    const formatDateTime = (dateTimeStr) => {
      if (!dateTimeStr) return null;
      try {
        // Parse the datetime string and store as UTC
        const date = new Date(dateTimeStr);
        return date.toISOString().slice(0, 19).replace('T', ' ');
      } catch (error) {
        console.error('Error formatting datetime:', dateTimeStr, error);
        return dateTimeStr;
      }
    };
    
    const formattedStartDateTime = formatDateTime(start_datetime);
    const formattedEndDateTime = formatDateTime(end_datetime);
    
    // Convert volunteer_enabled to proper boolean
    const volunteerEnabled = volunteer_enabled === 'true' || volunteer_enabled === true ? 1 : 0;
    
    // Validate modified_by - ensure it's a valid number or null
    const validModifiedBy = (modified_by && modified_by !== 'undefined' && !isNaN(modified_by)) ? parseInt(modified_by) : null;
    
                 let sql = 'UPDATE events SET name = ?, start_datetime = ?, end_datetime = ?, location = ?, raffle_tickets = ?, footer_location = ?, footer_phone = ?, footer_email = ?, volunteer_enabled = ?, welcome_text = ?, modified_by = ?';
        let params = [name, formattedStartDateTime, formattedEndDateTime, location, raffle_tickets || '', footer_location || null, footer_phone || null, footer_email || null, volunteerEnabled, welcome_text || null, validModifiedBy];
    
    // Handle banner upload
    if (req.files && req.files.banner) {
      const eventNameSlug = name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const timestamp = Date.now();
      const fileExtension = req.files.banner[0].originalname.split('.').pop();
      const newFilename = `banner_${eventNameSlug}_${timestamp}.${fileExtension}`;
      
      // Rename the uploaded file
      const oldPath = req.files.banner[0].path;
      const newPath = path.join(uploadDir, newFilename);
      fs.renameSync(oldPath, newPath);
      
      const banner = `/uploads/${newFilename}`;
      sql += ', banner = ?';
      params.push(banner);
      console.log(`Banner uploaded: ${banner}`);
    }

    // Handle header image upload
    if (req.files && req.files.header_image) {
      const eventNameSlug = name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const timestamp = Date.now();
      const fileExtension = req.files.header_image[0].originalname.split('.').pop();
      const newFilename = `header_${eventNameSlug}_${timestamp}.${fileExtension}`;
      
      // Rename the uploaded file
      const oldPath = req.files.header_image[0].path;
      const newPath = path.join(uploadDir, newFilename);
      fs.renameSync(oldPath, newPath);
      
      const header_image = `/uploads/${newFilename}`;
      sql += ', header_image = ?';
      params.push(header_image);
      console.log(`Header image uploaded: ${header_image}`);
    }
    sql += ' WHERE id = ?';
    params.push(id);
    
    console.log('SQL:', sql);
    console.log('Params:', params);
    
    await pool.execute(sql, params);
    
    const [rows] = await pool.execute('SELECT * FROM events WHERE id = ?', [id]);
    res.json({ success: true, event: rows[0] });
  } catch (error) {
    console.error('Edit event error:', error);
    res.status(500).json({ error: 'Failed to update event', details: error.message });
  }
});

// Update banner for an event
app.put('/api/events/:id/banner', upload.single('banner'), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No banner file uploaded' });
    }
    
    // Get current event name
    const [eventRows] = await pool.execute('SELECT name FROM events WHERE id = ?', [id]);
    if (eventRows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const eventName = eventRows[0].name;
    
    // Generate unique banner filename with event name
    const eventNameSlug = eventName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const timestamp = Date.now();
    const fileExtension = req.file.originalname.split('.').pop();
    const newFilename = `${eventNameSlug}_${timestamp}.${fileExtension}`;
    
    // Rename the uploaded file
    const oldPath = req.file.path;
    const newPath = path.join(uploadDir, newFilename);
    fs.renameSync(oldPath, newPath);
    
    const banner = `/uploads/${newFilename}`;
    console.log(`Banner updated for event ${id}: ${banner}`);
    
    // Update the banner in database
    await pool.execute('UPDATE events SET banner = ? WHERE id = ?', [banner, id]);
    
    const [rows] = await pool.execute('SELECT * FROM events WHERE id = ?', [id]);
    res.json({ success: true, event: rows[0] });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete event
app.delete('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM events WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

 // Get today's events (including events that span multiple days)
app.get('/api/todays-events', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('🔍 Fetching today\'s events for date:', today);
    
    // Get all events that are active today (either start today or are ongoing)
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
      ORDER BY start_datetime ASC
    `, [today, today]);
    
    if (rows.length > 0) {
      console.log(`✅ Found ${rows.length} events for today`);
      rows.forEach((event, index) => {
        console.log(`${index + 1}. ${event.name} (${new Date(event.start_datetime).toLocaleDateString()} to ${new Date(event.end_datetime).toLocaleDateString()})`);
      });
    } else {
      console.log('❌ No events found for today');
    }
    
    res.json(rows);
  } catch (error) {
    console.error('Get today\'s events error:', error);
    res.status(500).json({ error: "Failed to fetch today's events" });
  }
});

// Get today's event (including events that span multiple days) - for backward compatibility
app.get('/api/todays-event', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('🔍 Fetching today\'s event for date:', today);
    
    // Get events that are active today (either start today or are ongoing)
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
    
    if (rows[0]) {
      console.log('✅ Today\'s event found:', rows[0].name);
      console.log('📅 Event period:', new Date(rows[0].start_datetime).toLocaleDateString(), 'to', new Date(rows[0].end_datetime).toLocaleDateString());
      if (rows[0].banner) {
        console.log('📸 Banner path:', rows[0].banner);
      } else {
        console.log('❌ No banner for today\'s event');
      }
    } else {
      console.log('❌ No event found for today');
    }
    
    res.json(rows[0] || null);
  } catch (error) {
    console.error('Get today\'s event error:', error);
    res.status(500).json({ error: "Failed to fetch today's event" });
  }
});

// Get all registrations
app.get('/api/registrations', async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM registrations ORDER BY id DESC");
    res.json(rows);
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({ error: "Failed to fetch registrations" });
  }
});

// Check-in endpoint
app.post('/api/checkin', validate('checkin'), async (req, res) => {
  try {
    const { phone, registrationId, eventId } = req.body;
    
    let query, params;
    
    if (registrationId) {
      // Check-in by registration ID
      query = "SELECT * FROM registrations WHERE id = ? AND checked_in = 0";
      params = [registrationId];
    } else if (phone) {
      // Check-in by phone number
      query = "SELECT * FROM registrations WHERE phone = ? AND checked_in = 0";
      params = [phone];
    } else {
      return res.status(400).json({ success: false, message: "Phone number or registration ID required" });
    }
    
    const [rows] = await pool.execute(query, params);
    
    if (rows.length === 0) {
      // Check if registration exists but is already checked in
      let existingQuery, existingParams;
      if (registrationId) {
        existingQuery = "SELECT * FROM registrations WHERE id = ?";
        existingParams = [registrationId];
      } else if (phone) {
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

    // If client provided selected event, enforce event match
    if (eventId && rows[0].event_id && Number(rows[0].event_id) !== Number(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'QR not valid for selected event',
        error: `QR not valid for selected event. This QR belongs to "${rows[0].event_name}"`,
        eventName: rows[0].event_name,
        eventId: rows[0].event_id
      });
    }
    
    await pool.execute(
      "UPDATE registrations SET checked_in = 1, checkin_date = NOW() WHERE id = ?",
      [rows[0].id]
    );
    
    res.json({ success: true, message: "Check-in successful", name: rows[0].name });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ success: false, message: "Check-in failed" });
  }
});

// Check-in by ID
app.post('/api/registrations/:id/checkin', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      "SELECT * FROM registrations WHERE id = ?",
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Registration not found" });
    }
    
    if (rows[0].checked_in) {
      return res.status(400).json({ success: false, message: "Already checked in" });
    }
    
    await pool.execute(
      "UPDATE registrations SET checked_in = 1, checkin_date = NOW() WHERE id = ?",
      [id]
    );
    
    res.json({ success: true, message: "Check-in successful" });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ success: false, message: "Check-in failed" });
  }
});

// Reset check-ins
app.post('/api/registrations/reset-checkins', async (req, res) => {
  try {
    await pool.execute("UPDATE registrations SET checked_in = 0, checkin_date = NULL");
    res.json({ success: true, message: "All check-ins reset" });
  } catch (error) {
    console.error('Reset check-ins error:', error);
    res.status(500).json({ success: false, message: "Failed to reset check-ins" });
  }
});

// Raffle endpoints
app.get('/api/raffle/eligible-users', async (req, res) => {
  try {
    const { eventId } = req.query;
    
    console.log('🔍 Raffle eligible users request:', { eventId, date: new Date().toISOString() });
    
    let query, params;
    
    if (eventId) {
      // Get users who checked in TODAY for a specific event
      query = "SELECT * FROM registrations WHERE checked_in = 1 AND DATE(checkin_date) = CURDATE() AND event_id = ? ORDER BY checkin_date DESC";
      params = [eventId];
    } else {
      // Get users who checked in TODAY only (for backward compatibility)
      query = "SELECT * FROM registrations WHERE checked_in = 1 AND DATE(checkin_date) = CURDATE() ORDER BY checkin_date DESC";
      params = [];
    }
    
    console.log('🔍 Executing query:', query, 'with params:', params);
    
    const [rows] = await pool.execute(query, params);
    
    console.log(`✅ Found ${rows.length} eligible users for raffle`);
    if (rows.length > 0) {
      console.log('📋 Sample users:', rows.slice(0, 3).map(u => ({ id: u.id, name: u.name, checkin_date: u.checkin_date, event_id: u.event_id })));
    }
    
    res.json(rows);
  } catch (error) {
    console.error('❌ Get eligible users error:', error);
    res.status(500).json({ error: "Failed to fetch eligible users" });
  }
});

app.post('/api/raffle/save-winner', validate('raffleWinner'), async (req, res) => {
  try {
    const { registrationId, prize } = req.body;
    const [rows] = await pool.execute(
      "SELECT * FROM registrations WHERE id = ?",
      [registrationId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Registration not found" });
    }
    
    const registration = rows[0];
    
    await pool.execute(
      "INSERT INTO raffle_winners (registration_id, name, phone, email, event_name, win_date, win_time) VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
      [registrationId, registration.name, registration.phone, registration.email, registration.event_name]
    );
    
    res.json({ success: true, message: "Winner saved" });
  } catch (error) {
    console.error('Save winner error:', error);
    res.status(500).json({ success: false, message: "Failed to save winner" });
  }
});

app.get('/api/raffle/winners', async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM raffle_winners ORDER BY won_at DESC");
    res.json(rows);
  } catch (error) {
    console.error('Get winners error:', error);
    res.status(500).json({ error: "Failed to fetch winners" });
  }
});

// Get raffle winners
app.get('/api/raffle-winners', async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM raffle_winners ORDER BY won_at DESC");
    res.json(rows);
  } catch (error) {
    console.error('Get raffle winners error:', error);
    res.status(500).json({ error: "Failed to fetch raffle winners" });
  }
});

// New: Save a raffle winner (called from spin wheel)
app.post('/api/raffle-winners', validate('raffleWinner'), async (req, res) => {
  try {
    const { registrationId } = req.body;
    if (!registrationId) {
      return res.status(400).json({ success: false, message: 'registrationId is required' });
    }

    // Fetch registration details to persist winner info
    const [regs] = await pool.execute(
      'SELECT id, name, email, phone, event_name FROM registrations WHERE id = ?',
      [registrationId]
    );

    if (regs.length === 0) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    const reg = regs[0];

    // Persist with event_name and split win_date/win_time for table display
    await pool.execute(
      'INSERT INTO raffle_winners (registration_id, name, email, phone, event_name, win_date, win_time, won_at) VALUES (?, ?, ?, ?, ?, CURDATE(), CURTIME(), NOW())',
      [reg.id, reg.name || null, reg.email || null, reg.phone || null, reg.event_name || null]
    );

    // Send winner confirmation email
    try {
      if (reg.email && GMAIL_USER && GMAIL_APP_PASSWORD) {
        const transporter = await createVerifiedTransporter('ssl');
        const mailOptions = {
          from: GMAIL_USER,
          to: reg.email,
          subject: `🎉 Congratulations! You're a Raffle Winner!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                Hello ${reg.name},
              </p>
              
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                Congratulations! You have been selected as the winner of the raffle for the <strong>"${reg.event_name}"</strong>
              </p>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
                <p style="margin: 8px 0;"><span style="color: #666;">🗓</span> <strong>Date:</strong> ${new Date().toLocaleDateString("en-US", {timeZone: "America/New_York"})}</p>
                <p style="margin: 8px 0;"><span style="color: #666;">⏰</span> <strong>Time:</strong> ${new Date().toLocaleTimeString("en-US", {timeZone: "America/New_York", hour: '2-digit', minute: '2-digit'})}</p>
                <p style="margin: 8px 0;"><span style="color: #666;">🆔</span> <strong>Registration ID:</strong> ${reg.id}</p>
              </div>
              
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                Please contact the event organizers to claim your prize.
              </p>
              
              <p style="font-size: 16px; color: #333; margin-bottom: 10px;">
                Warm regards,<br><strong>Indo American Fair Team</strong>
              </p>
              
              <div style="border-top: 1px solid #ddd; margin-top: 20px; padding-top: 15px; font-size: 14px; color: #666;">
                <p style="margin: 5px 0;"><span style="color: #666;">🌐</span> <a href="https://www.indoamericanfair.com/" style="color: #8B1C1C;">https://www.indoamericanfair.com/</a></p>
                <p style="margin: 5px 0;"><span style="color: #666;">📧</span> Indoamericanfair2016@gmail.com</p>
                <p style="margin: 5px 0;"><span style="color: #666;">📞</span> 609-937-2806 | 609-937-2800</p>
              </div>
            </div>
          `
        };
        
        await transporter.sendMail(mailOptions);
        console.log('✅ Winner email sent successfully to:', reg.email);
      }
    } catch (emailError) {
      console.error('❌ Failed to send winner email:', emailError);
      // Continue even if email fails
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Save raffle winner error:', error);
    res.status(500).json({ success: false, message: 'Failed to save raffle winner' });
  }
});

// Backfill missing event_name and win_date/win_time in raffle_winners from registrations
app.post('/api/raffle-winners/backfill', async (req, res) => {
  try {
    // Fill event_name from registrations when missing
    await pool.execute(`
      UPDATE raffle_winners rw
      JOIN registrations r ON rw.registration_id = r.id
      SET rw.event_name = r.event_name
      WHERE (rw.event_name IS NULL OR rw.event_name = '')
    `);

    // If win_date or win_time missing, derive from won_at
    await pool.execute(`
      UPDATE raffle_winners
      SET win_date = IFNULL(win_date, DATE(won_at)),
          win_time = IFNULL(win_time, TIME(won_at))
      WHERE win_date IS NULL OR win_time IS NULL
    `);

    res.json({ success: true });
  } catch (error) {
    console.error('Backfill raffle_winners error:', error);
    res.status(500).json({ success: false, message: 'Failed to backfill winners' });
  }
});

// Upload banner endpoint
app.post('/api/upload-banner', upload.single('banner'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    
    const { eventId } = req.body;
    const bannerPath = `/uploads/${req.file.filename}`;
    
    await pool.execute(
      "UPDATE events SET banner = ? WHERE id = ?",
      [bannerPath, eventId]
    );
    
    res.json({ success: true, bannerPath });
  } catch (error) {
    console.error('Upload banner error:', error);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
});

// Test email sending with a simple test
app.post('/api/test-email-send', validate('testEmail'), async (req, res) => {
  try {
    const { testEmail } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({ error: "Please provide testEmail in request body" });
    }
    
    console.log('🔍 Testing email sending to:', testEmail);
    
    const transporter = await createVerifiedTransporter('ssl');
    
    const mailOptions = {
      from: GMAIL_USER,
      to: testEmail,
      subject: 'Test Email from NGO Kiosk App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Test Email from NGO Kiosk App</h2>
          <p style="font-size: 16px; color: #333;">This is a test email to verify that the email system is working correctly.</p>
          <p style="font-size: 16px; color: #333;">If you received this email, the email configuration is working!</p>
          <p style="font-size: 14px; color: #666;">Sent at: ${new Date().toISOString()}</p>
        </div>
      `
    };
    
    console.log('📧 Sending test email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });
    
    await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully to:', testEmail);
    
    res.json({ 
      success: true, 
      message: "Test email sent successfully",
      sentTo: testEmail
    });
  } catch (error) {
    console.error('❌ Test email failed:', error);
    res.status(500).json({ 
      error: "Test email failed", 
      details: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
  }
});

// Test email configuration
app.get('/api/test-email', async (req, res) => {
  try {
    console.log('🔍 Testing email configuration...');
    
    const transporter = await createVerifiedTransporter('ssl');
    
    res.json({ 
      success: true, 
      message: "Email configuration is working",
      note: "You still need to set up the actual Gmail app password"
    });
  } catch (error) {
    console.error('❌ Email test failed:', error);
    res.status(500).json({ 
      error: "Email configuration failed", 
      details: error.message,
      code: error.code,
      command: error.command
    });
  }
});

// Simple email test endpoint
app.post('/api/test-email-simple', validate('testEmail'), async (req, res) => {
  try {
    const { testEmail } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({ error: "Please provide testEmail in request body" });
    }
    
    console.log('🔍 Testing simple email to:', testEmail);
    
    const transporter = await createVerifiedTransporter('ssl');
    
    const mailOptions = {
      from: GMAIL_USER,
      to: testEmail,
      subject: 'Test Email from NGO Kiosk',
      text: 'This is a test email to verify the email system is working.',
      html: '<h1>Test Email</h1><p>This is a test email to verify the email system is working.</p>'
    };
    
    console.log('📧 Sending test email...');
    await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully to:', testEmail);
    
    res.json({ 
      success: true, 
      message: "Test email sent successfully",
      sentTo: testEmail
    });
  } catch (error) {
    console.error('❌ Test email failed:', error);
    res.status(500).json({ 
      error: "Test email failed", 
      details: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
  }
});

// Admin Management Endpoints

// Get all admin users
app.get('/api/admin/users', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT id, username, admin_id, created_at, is_active, 
             (SELECT username FROM users WHERE id = u.created_by) as created_by_name
      FROM users u 
      ORDER BY created_at DESC
    `);
    
    res.json({ success: true, users: rows });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Create new admin user
app.post('/api/admin/users', validate('adminUser'), async (req, res) => {
  try {
    const { username, password, admin_id } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    
    // Generate admin ID if not provided
    let finalAdminId = admin_id;
    if (!finalAdminId) {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.random().toString(36).substring(2, 5).toUpperCase();
      finalAdminId = `ADMIN${timestamp}${random}`;
    }
    
    // Check if username or admin_id already exists
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR admin_id = ?',
      [username, finalAdminId]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Username or Admin ID already exists' });
    }
    
    // Hash password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create new admin user (for now, created_by will be NULL for the first admin)
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, admin_id) VALUES (?, ?, ?)',
      [username, hashedPassword, finalAdminId]
    );
    
    res.json({ 
      success: true, 
      message: 'Admin user created successfully',
      userId: result.insertId,
      adminId: finalAdminId
    });
  } catch (error) {
    console.error('Create admin user error:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Update admin user
app.put('/api/admin/users/:id', validate('adminUser'), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, is_active } = req.body;
    
    // Validate input
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }
    
    // Check if username already exists for other users
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [username, id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }
    
    let sql = 'UPDATE users SET ';
    let params = [];
    
    if (username) {
      sql += 'username = ?, ';
      params.push(username);
    }
    
    if (password) {
      // Hash password using bcrypt
      const hashedPassword = await bcrypt.hash(password, 12);
      sql += 'password = ?, ';
      params.push(hashedPassword);
    }
    
    if (typeof is_active === 'boolean') {
      sql += 'is_active = ?, ';
      params.push(is_active);
    }
    
    sql = sql.slice(0, -2); // Remove last comma and space
    sql += ' WHERE id = ?';
    params.push(id);
    
    await pool.execute(sql, params);
    
    res.json({ success: true, message: 'Admin user updated successfully' });
  } catch (error) {
    console.error('Update admin user error:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Delete admin user
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Don't allow deleting the main admin (id = 1)
    if (id == 1) {
      return res.status(400).json({ success: false, message: 'Cannot delete the main admin user' });
    }
    
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Admin user deleted successfully' });
  } catch (error) {
    console.error('Delete admin user error:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: 'Server is working with multi-admin support!',
    timestamp: new Date().toISOString()
  });
});

// Simple working endpoint - no host header validation
app.get('/working', (req, res) => {
  res.json({
    status: 'SUCCESS',
    message: 'This endpoint should work!',
    timestamp: new Date().toISOString(),
    server: 'NGO Kiosk Backend'
  });
});

// Delete registration
app.delete('/api/registrations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if registration exists
    const [rows] = await pool.execute('SELECT * FROM registrations WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }
    
    // Delete the registration
    await pool.execute('DELETE FROM registrations WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Registration deleted successfully' });
  } catch (error) {
    console.error('Delete registration error:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Delete raffle winner
app.delete('/api/raffle-winners/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if raffle winner exists
    const [rows] = await pool.execute('SELECT * FROM raffle_winners WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Raffle winner not found' });
    }
    
    // Delete the raffle winner
    await pool.execute('DELETE FROM raffle_winners WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Raffle winner deleted successfully' });
  } catch (error) {
    console.error('Delete raffle winner error:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Debug endpoint to check static files
app.get('/debug-static', (req, res) => {
  const fs = require('fs');
  const publicPath = path.join(__dirname, 'public');
  const staticPath = path.join(publicPath, 'static');
  const jsPath = path.join(staticPath, 'js');
  
  try {
    const files = {
      publicExists: fs.existsSync(publicPath),
      staticExists: fs.existsSync(staticPath),
      jsExists: fs.existsSync(jsPath),
      jsFiles: fs.existsSync(jsPath) ? fs.readdirSync(jsPath) : [],
      indexHtml: fs.existsSync(path.join(publicPath, 'index.html')) ? 'exists' : 'missing'
    };
    res.json(files);
  } catch (error) {
    res.json({ error: error.message });
  }
});

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

const PORT = process.env.PORT || 8080;

// Initialize database and start server
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
    console.log('✅ Database initialized successfully');

    // Start server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ Process ID: ${process.pid}`);
      
      // Keep the server alive
      setInterval(() => {
        console.log('💓 Server heartbeat - keeping alive');
      }, 30000); // Every 30 seconds
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error('❌ Port is already in use');
      }
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

