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

// CORS configuration for Azure
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

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
    // Don't exit - let the server start and we'll handle errors in endpoints
  });

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
    
    res.json({ success: true, message: "Registration successful" });
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
    
    connection.release();
    
    res.json({ 
      success: true, 
      tables: tables.map(t => Object.values(t)[0]),
      eventsCount: events[0].count
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
    res.json(rows);
  } catch (error) {
    console.error('❌ Get events error:', error);
    res.status(500).json({ error: "Failed to fetch events", details: error.message });
  }
});

// Add event
app.post('/api/events', upload.single('banner'), async (req, res) => {
  try {
    const { name, date, time, location } = req.body;
    const banner = req.file ? `/uploads/${req.file.filename}` : null;
    
    const [result] = await pool.execute(
      'INSERT INTO events (name, date, time, location, banner) VALUES (?, ?, ?, ?, ?)',
      [name, date, time, location, banner]
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
    
    let sql = 'UPDATE events SET name = ?, date = ?, time = ?, location = ?';
    let params = [name, date, time, location];
    
    if (req.file) {
      sql += ', banner = ?';
      params.push(`/uploads/${req.file.filename}`);
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
    const [rows] = await pool.execute(
      "SELECT * FROM events WHERE date = ? ORDER BY date DESC LIMIT 1",
      [today]
    );
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

// Handle React routing - serve index.html for all non-API routes (MUST BE LAST)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});