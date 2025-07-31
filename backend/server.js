const express = require('express');
const cors = require('cors');
const { pool, initializeDatabase } = require('./db');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
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
initializeDatabase().catch(console.error);

// Handle React routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return; // Let API routes be handled normally
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
    
    res.json({ success: true, message: "Registration successful" });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM events ORDER BY date DESC");
    res.json(rows);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: "Failed to fetch events" });
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
    const { phone } = req.body;
    const [rows] = await pool.execute(
      "SELECT * FROM registrations WHERE phone = ? AND checked_in = 0",
      [phone]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Registration not found or already checked in" });
    }
    
    await pool.execute(
      "UPDATE registrations SET checked_in = 1, checkin_date = NOW() WHERE id = ?",
      [rows[0].id]
    );
    
    res.json({ success: true, message: "Check-in successful" });
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

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});