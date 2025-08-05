const express = require('express');
const cors = require('cors');
const { pool, initializeDatabase } = require('./db');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

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
app.get('/health', (req, res) => {
  console.log('Health check hit!');
  res.status(200).json({
    status: 'OK',
    message: 'NGO Kiosk is running!',
    timestamp: new Date().toISOString()
  });
});

// Root path - serve React app
app.get('/', (req, res) => {
  console.log('Serving React app for root path');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Azure App Service configuration
app.set('trust proxy', 1);

// CRITICAL: Handle host header issue at the very beginning
app.use((req, res, next) => {
  // Set headers that should bypass host header validation
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Log the request for debugging
  console.log(`${req.method} ${req.path} - Host: ${req.headers.host}`);
  
  next();
});

// CORS configuration for Azure
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Initialize database on startup
initializeDatabase()
  .then(() => {
    console.log('✅ Database initialized successfully');
  })
  .catch((error) => {
    console.error('❌ Database initialization failed:', error);
    // Don't exit - let the server start and we'll handle errors in endpoints
  });

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE username = ? AND password = ?",
      [username, password]
    );
    if (rows.length > 0) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Invalid username or password" });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Register endpoint
app.post('/api/register', async (req, res) => {
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
    
    // Insert registration with correct column names
    const [result] = await pool.execute(
      "INSERT INTO registrations (name, phone, email, event_id, event_name, event_date, interested_to_volunteer, registered_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
      [name, phone, email, eventId, event.name, event.date, interested_to_volunteer]
    );
    
    const registrationId = result.insertId;
    
    // Generate QR code data
    const qrData = JSON.stringify({
      registrationId: registrationId,
      name: name,
      phone: phone,
      email: email
    });
    
    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);
    
    // Send email with QR code
    try {
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'ngo.kiosk@gmail.com',
          pass: process.env.EMAIL_PASS || 'your-app-password'
        }
      });
      
      const mailOptions = {
        from: process.env.EMAIL_USER || 'ngo.kiosk@gmail.com',
        to: email,
        subject: `Registration Confirmed for ${event.name} at Non-Governmental Organization`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="color: #28a745; font-size: 24px;">✓</span>
              <h2 style="color: #333; margin: 10px 0;">Registration Confirmed for ${event.name}</h2>
            </div>
            
            <p style="font-size: 16px; color: #333;">Hello ${name},</p>
            
            <p style="font-size: 16px; color: #333;">You have successfully registered for the event <strong>${event.name}</strong> at Non-Governmental Organization.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Event Details:</h3>
              <p style="margin: 8px 0;"><span style="color: #666;">📅</span> <strong>Date:</strong> ${event.date}</p>
              <p style="margin: 8px 0;"><span style="color: #666;">🕕</span> <strong>Time:</strong> ${event.time}</p>
              <p style="margin: 8px 0;"><span style="color: #666;">📍</span> <strong>Venue:</strong> Non-Governmental Organization, 12 Perrine Road, Monmouth Junction, NJ 08852</p>
              <p style="margin: 8px 0;"><span style="color: #666;">🆔</span> <strong>Registration ID:</strong> ${registrationId}</p>
            </div>
            
            <p style="font-size: 16px; color: #333;">Please bring this email and scan the attached QR code at the kiosk during check-in. We look forward to welcoming you!</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <img src="${qrCodeDataUrl}" alt="QR Code for Check-in" style="max-width: 200px; border: 2px solid #ddd; border-radius: 10px;">
              <p style="font-size: 14px; color: #666; margin-top: 10px;">Scan this QR code at the kiosk for check-in</p>
            </div>
            
            <p style="font-size: 16px; color: #333;">Warm regards,<br><strong>Non-Governmental Organization Team</strong></p>
            
            <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px;">
              <p style="margin: 5px 0;"><span style="color: #666;">📧</span> <a href="mailto:NGO@gmail.com" style="color: #8B1C1C;">NGO@gmail.com</a></p>
              <p style="margin: 5px 0;"><span style="color: #666;">📞</span> <a href="tel:609-937-2800" style="color: #8B1C1C;">609-937-2800</a></p>
            </div>
          </div>
        `
      };
      
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully to:', email);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the registration if email fails
    }
    
    res.json({ 
      success: true, 
      message: "Registration successful", 
      registrationId: registrationId,
      qrCode: qrCodeDataUrl
    });
  } catch (error) {
    console.error('Registration error:', error);
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

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    console.log('🔍 Fetching events from database...');
    const [rows] = await pool.execute("SELECT * FROM events ORDER BY date DESC");
    console.log(`✅ Found ${rows.length} events`);
    
    // Debug: Log banner paths
    rows.forEach((event, index) => {
      if (event.banner) {
        console.log(`Event ${index + 1}: ${event.name} - Banner: ${event.banner}`);
      }
    });
    
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
app.post('/api/events', upload.single('banner'), async (req, res) => {
  try {
    const { name, date, time, location } = req.body;
    
    // Generate unique banner filename with event name
    let banner = null;
    if (req.file) {
      const eventNameSlug = name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const timestamp = Date.now();
      const fileExtension = req.file.originalname.split('.').pop();
      const newFilename = `${eventNameSlug}_${timestamp}.${fileExtension}`;
      
      // Rename the uploaded file
      const oldPath = req.file.path;
      const newPath = path.join(uploadDir, newFilename);
      fs.renameSync(oldPath, newPath);
      
      banner = `/uploads/${newFilename}`;
      console.log(`Banner uploaded: ${banner}`);
    }
    
    // Convert time to 24-hour format
    const convertedTime = convertTo24Hour(time);
    
    const [result] = await pool.execute(
      'INSERT INTO events (name, date, time, location, banner) VALUES (?, ?, ?, ?, ?)',
      [name, date, convertedTime, location, banner]
    );
    
    const [rows] = await pool.execute('SELECT * FROM events WHERE id = ?', [result.insertId]);
    res.json({ success: true, event: rows[0] });
  } catch (error) {
    console.error('Add event error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Edit event
app.put('/api/events/:id', upload.single('banner'), async (req, res) => {
  try {
    const { name, date, time, location } = req.body;
    const { id } = req.params;
    
    // Convert time to 24-hour format
    const convertedTime = convertTo24Hour(time);
    
    let sql = 'UPDATE events SET name = ?, date = ?, time = ?, location = ?';
    let params = [name, date, convertedTime, location];
    
    if (req.file) {
      // Generate unique banner filename with event name
      const eventNameSlug = name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const timestamp = Date.now();
      const fileExtension = req.file.originalname.split('.').pop();
      const newFilename = `${eventNameSlug}_${timestamp}.${fileExtension}`;
      
      // Rename the uploaded file
      const oldPath = req.file.path;
      const newPath = path.join(uploadDir, newFilename);
      fs.renameSync(oldPath, newPath);
      
      const banner = `/uploads/${newFilename}`;
      console.log(`Banner updated: ${banner}`);
      
      sql += ', banner = ?';
      params.push(banner);
    }
    sql += ' WHERE id = ?';
    params.push(id);
    
    await pool.execute(sql, params);
    
    const [rows] = await pool.execute('SELECT * FROM events WHERE id = ?', [id]);
    res.json({ success: true, event: rows[0] });
  } catch (error) {
    console.error('Edit event error:', error);
    res.status(500).json({ error: 'Database error' });
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

// Get today's event
app.get('/api/todays-event', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('🔍 Fetching today\'s event for date:', today);
    const [rows] = await pool.execute(
      "SELECT * FROM events WHERE date = ? ORDER BY date DESC LIMIT 1",
      [today]
    );
    
    if (rows[0]) {
      console.log('✅ Today\'s event found:', rows[0].name);
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
app.post('/api/checkin', async (req, res) => {
  try {
    const { phone, registrationId } = req.body;
    
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
      return res.status(404).json({ success: false, message: "Registration not found or already checked in" });
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
    const [rows] = await pool.execute(
      "SELECT * FROM registrations WHERE checked_in = 1"
    );
    res.json(rows);
  } catch (error) {
    console.error('Get eligible users error:', error);
    res.status(500).json({ error: "Failed to fetch eligible users" });
  }
});

app.post('/api/raffle/save-winner', async (req, res) => {
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

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: 'Server is working!',
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

// Handle React routing - serve index.html for all non-API routes (MUST BE LAST)
app.get('*', (req, res) => {
  // Don't serve React app for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Don't serve React app for static files that exist
  const filePath = path.join(__dirname, 'public', req.path);
  if (require('fs').existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  
  console.log('Serving React app for path:', req.path);
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Process ID: ${process.pid}`);
  
  // Keep the server alive
  setInterval(() => {
    console.log('Server heartbeat - keeping alive');
  }, 30000); // Every 30 seconds
});