const express = require('express');
const cors = require('cors');
const { pool, initializeDatabase } = require('./db');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Azure App Service configuration
app.set('trust proxy', 1);

// Basic Express configuration for Azure App Service
app.use(express.json());
app.use(cors());

// Azure App Service host header fix
app.use((req, res, next) => {
  // Allow all hosts for Azure App Service
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Simple test endpoint that should work
app.get('/test', (req, res) => {
  res.json({
    message: 'Server is working!',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'NGO Kiosk is running!',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'NGO Kiosk API is running!',
    endpoints: {
      health: '/health',
      test: '/test',
      events: '/api/events',
      register: '/api/register',
      checkin: '/api/checkin'
    }
  });
});

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'public')));

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
  });

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API endpoints
app.get('/api/events', async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM events ORDER BY date DESC");
    res.json(rows);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { name, phone, email, eventId, interested_to_volunteer } = req.body;
    
    const [eventRows] = await pool.execute("SELECT * FROM events WHERE id = ?", [eventId]);
    if (eventRows.length === 0) {
      return res.status(400).json({ success: false, message: "Event not found" });
    }
    
    const event = eventRows[0];
    
    await pool.execute(
      "INSERT INTO registrations (name, phone, email, event_id, event_name, event_date, interested_to_volunteer, registered_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
      [name, phone, email, eventId, event.name, event.date, interested_to_volunteer]
    );
    
    res.json({ success: true, message: "Registration successful" });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

app.post('/api/checkin', async (req, res) => {
  try {
    const { phone, registrationId } = req.body;
    
    let query, params;
    
    if (registrationId) {
      query = "SELECT * FROM registrations WHERE id = ? AND checked_in = 0";
      params = [registrationId];
    } else if (phone) {
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

// Handle React routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});