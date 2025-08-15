const express = require('express');
const cors = require('cors');
const db = require('./db');
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

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await db.execute(
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

app.post('/api/register', async (req, res) => {
  try {
    console.log("Register endpoint hit");
    const { name, phone, email, eventId, interested_to_volunteer } = req.body;
    const event_id = eventId; // Map eventId to event_id for database
    console.log("Request body:", req.body);
    console.log("Event ID:", event_id);
    console.log("Volunteer value received:", interested_to_volunteer);
    
    if (!name || !phone || !email || !event_id) {
      console.log('Missing required fields:', { name, phone, email, event_id });
      return res.status(400).json({ error: 'All fields required' });
    }

    // Fetch event details for event_name, event_date, and time
    console.log('Fetching event with ID:', event_id);
    const [eventRows] = await db.execute('SELECT name, date, time FROM events WHERE id = ?', [event_id]);
    console.log('Event rows found:', eventRows);
    if (eventRows.length === 0) {
      console.log('Event not found for ID:', event_id);
      return res.status(500).json({ error: 'Event not found' });
    }
    
    const eventRow = eventRows[0];
    const volunteerValue = (interested_to_volunteer || '').trim();
    console.log("Inserting with volunteer value:", volunteerValue);
    
    console.log('Inserting registration with data:', { name, phone, email, event_id, event_name: eventRow.name, event_date: eventRow.date, volunteerValue });
    const [result] = await db.execute(
      'INSERT INTO registrations (name, phone, email, event_id, event_name, event_date, interested_to_volunteer) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, phone, email, event_id, eventRow.name, eventRow.date, volunteerValue]
    );
    console.log('Registration inserted with ID:', result.insertId);

    const registrationId = result.insertId;
    const qrData = JSON.stringify({ registrationId, name });
    console.log('QR Code data being generated:', qrData);
    const qrImage = await QRCode.toDataURL(qrData);
    const base64Data = qrImage.replace(/^data:image\/png;base64,/, "");

    // Prepare email content
    const subject = `✅ Registration Confirmed for ${eventRow.name} at Non-Governmental Organization`;
    const html = `
      <p>Hello ${name},</p>
      <p>You have successfully registered for the event <b>${eventRow.name}</b> at Non-Governmental Organization.</p>
      <p>🗓 <b>Date:</b> ${eventRow.date}</p>
      <p>⏰ <b>Time:</b> ${eventRow.time || 'All Day'}</p>
      <p>📍 <b>Venue:</b> Non-Governmental Organization, 12 Perrine Road, Monmouth Junction, NJ 08852</p>
      <p>🆔 <b>Registration ID:</b> ${registrationId}</p>
      <p>Please bring this email and scan the attached QR code at the kiosk during check-in.</p>
      <p>We look forward to welcoming you!</p>
      <br/>
      <p>Warm regards,<br/>
      Non-Governmental Organization Team<br/>
      📧 NGO@gmail.com | ☎️ 609-937-2800</p>
    `;

    // Send response immediately after database insertion
    res.json({ success: true, registrationId });

    // Send email asynchronously (don't wait for it)
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'sridanyaravi07@gmail.com',
        pass: 'axkghxaldttnldla'
      }
    });

    let mailOptions = {
      from: 'NGO@gmail.com',
      to: email,
      subject,
      html,
      attachments: [{
        filename: 'qrcode.png',
        content: base64Data,
        encoding: 'base64',
        cid: 'qrcode'
      }]
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Email error:', error);
      } else {
        console.log('Email sent successfully');
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM events');
    res.json(rows);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Add event
app.post('/api/events', upload.single('banner'), async (req, res) => {
  try {
    const { name, date, time, location } = req.body;
    const banner = req.file ? `/uploads/${req.file.filename}` : null;
    
    const [result] = await db.execute(
      'INSERT INTO events (name, date, time, location, banner) VALUES (?, ?, ?, ?, ?)',
      [name, date, time, location, banner]
    );
    
    const [rows] = await db.execute('SELECT * FROM events WHERE id = ?', [result.insertId]);
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
    
    await db.execute(sql, params);
    
    const [rows] = await db.execute('SELECT * FROM events WHERE id = ?', [id]);
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
    await db.execute('DELETE FROM events WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Serve uploaded banners
app.use('/uploads', express.static(uploadDir));

// New endpoint: Get all registrations with event details
app.get('/api/registrations', async (req, res) => {
  try {
    const sql = `
      SELECT r.id, r.name, r.phone, r.email, r.event_name, r.event_date, r.checked_in, r.checkin_date, r.interested_to_volunteer
      FROM registrations r
      ORDER BY r.id DESC
    `;
    const [rows] = await db.execute(sql);
    res.json(rows);
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Check-in endpoint
app.post('/api/checkin', async (req, res) => {
  try {
    const { registrationId } = req.body;

    console.log('Check-in attempt for registration id:', registrationId);

    // Fetch registration and its event_id, event_name, and checked_in status
    const [rows] = await db.execute('SELECT checked_in, event_id, event_name, name FROM registrations WHERE id = ?', [registrationId]);
    if (rows.length === 0) {
      console.warn('No registration found for id:', registrationId);
      return res.status(404).json({ error: 'Registration not found' });
    }

    const row = rows[0];

    // Check if already checked in
    if (row.checked_in) {
      console.warn('Already scanned for registration id:', registrationId);
      return res.json({ success: false, error: "QR already scanned" });
    }

    // Allow check-in for newsletter/general event regardless of date
    if (row.event_name === 'Register for Newsletter and General Events') {
      const today = new Date().toISOString().split('T')[0];
      await db.execute('UPDATE registrations SET checked_in = 1, checkin_date = ? WHERE id = ?', [today, registrationId]);
      res.json({ success: true, name: row.name, eventName: row.event_name });
      return;
    }

    // For all other events, check if registration is for today's event
    const [eventRows] = await db.execute(`SELECT id FROM events WHERE date = CURDATE()`);
    if (eventRows.length === 0 || row.event_id !== eventRows[0].id) {
      console.warn('QR not valid for this event. Registration event_id:', row.event_id, 'Today event id:', eventRows[0] && eventRows[0].id);
      return res.json({ success: false, error: 'QR not valid for this event' });
    }

    const today = new Date().toISOString().split('T')[0];
    await db.execute('UPDATE registrations SET checked_in = 1, checkin_date = ? WHERE id = ?', [today, registrationId]);

    // Fetch event name for success response
    const sql = `
      SELECT e.name AS event_name
      FROM registrations r
      LEFT JOIN events e ON r.event_id = e.id
      WHERE r.id = ?
    `;
    const [detailRows] = await db.execute(sql, [registrationId]);
    res.json({
      success: true,
      name: row.name,
      eventName: detailRows[0].event_name
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// New endpoint: Mark a registration as checked in
app.post('/api/registrations/:id/checkin', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    console.log('Check-in attempt for registration id:', id, 'name:', name);

    // Fetch registration and its event_id, event_name, and checked_in status
    const [rows] = await db.execute('SELECT checked_in, event_id, event_name FROM registrations WHERE id = ?', [id]);
    if (rows.length === 0) {
      console.warn('No registration found for id:', id);
      return res.status(404).json({ error: 'Registration not found' });
    }

    const row = rows[0];

    // Allow check-in for newsletter/general event regardless of date
    if (row.event_name === 'Register for Newsletter and General Events') {
      if (row.checked_in) {
        console.warn('Already scanned for registration id:', id);
        return res.json({ success: false, error: "Already scanned" });
      }
      const today = new Date().toISOString().split('T')[0];
      await db.execute('UPDATE registrations SET checked_in = 1, checkin_date = ? WHERE id = ?', [today, id]);
      res.json({ success: true, name: name, eventName: row.event_name });
      return;
    }

    // For all other events, check if registration is for today's event
    const [eventRows] = await db.execute(`SELECT id FROM events WHERE date = CURDATE()`);
    if (eventRows.length === 0 || row.event_id !== eventRows[0].id) {
      console.warn('QR not valid for this event. Registration event_id:', row.event_id, 'Today event id:', eventRows[0] && eventRows[0].id);
      return res.json({ success: false, error: 'QR not valid for this event' });
    }

    if (row.checked_in) {
      console.warn('Already scanned for registration id:', id);
      return res.json({ success: false, error: "Already scanned" });
    }

    const today = new Date().toISOString().split('T')[0];
    await db.execute('UPDATE registrations SET checked_in = 1, checkin_date = ? WHERE id = ?', [today, id]);

    // Fetch event name for success response
    const sql = `
      SELECT e.name AS event_name
      FROM registrations r
      LEFT JOIN events e ON r.event_id = e.id
      WHERE r.id = ?
    `;
    const [detailRows] = await db.execute(sql, [id]);
    res.json({
      success: true,
      name: name,
      eventName: detailRows[0].event_name
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Endpoint: Delete all registrations
app.delete('/api/registrations', async (req, res) => {
  try {
    await db.execute('DELETE FROM registrations');
    res.json({ success: true });
  } catch (error) {
    console.error('Delete registrations error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Endpoint: Reset all check-ins (for testing)
app.post('/api/registrations/reset-checkins', async (req, res) => {
  try {
    await db.execute('UPDATE registrations SET checked_in = 0');
    res.json({ success: true, message: 'All check-ins reset' });
  } catch (error) {
    console.error('Reset check-ins error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get today's event(s) or next upcoming event
app.get('/api/todays-event', async (req, res) => {
  try {
    // First, try to get today's events
    const [todayRows] = await db.execute(`SELECT * FROM events WHERE date = CURDATE() ORDER BY time ASC`);
    
    if (todayRows.length > 0) {
      // If there are events today, return the first one
      res.json([todayRows[0]]);
    } else {
      // If no events today, get the next upcoming event
      const [futureRows] = await db.execute(`
        SELECT * FROM events 
        WHERE date > CURDATE() 
        ORDER BY date ASC, time ASC 
        LIMIT 1
      `);
      
      if (futureRows.length > 0) {
        res.json([futureRows[0]]);
      } else {
        // If no future events, return empty array
        res.json([]);
      }
    }
  } catch (error) {
    console.error('Get today\'s event error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get eligible users for the raffle (checked-in, not already a winner)
app.get('/api/raffle/eligible-users', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const sql = `
      SELECT r.* FROM registrations r
      WHERE r.checked_in = 1
        AND r.checkin_date = ?
        AND r.id NOT IN (SELECT registration_id FROM raffle_winners)
    `;
    const [rows] = await db.execute(sql, [today]);
    res.json(rows);
  } catch (error) {
    console.error('Get eligible users error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Save a raffle winner (new endpoint for updated frontend)
app.post('/api/raffle/save-winner', async (req, res) => {
  try {
    const { winner_id, winner_name, spin_time } = req.body;
    
    // Get the registration details
    const [registrationRows] = await db.execute('SELECT * FROM registrations WHERE id = ?', [winner_id]);
    if (registrationRows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    const registration = registrationRows[0];
    const won_at = new Date().toISOString();
    
    const [result] = await db.execute(
      'INSERT INTO raffle_winners (registration_id, name, phone, email, event_name, event_date, won_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [winner_id, winner_name, registration.phone, registration.email, registration.event_name, registration.event_date, won_at]
    );
    
    // Send winner notification email
    if (registration.email) {
      let transporter = require('nodemailer').createTransport({
        service: 'gmail',
        auth: {
          user: 'sridanyaravi07@gmail.com',
          pass: 'axkghxaldttnldla'
        }
      });
      const subject = `🎉 Congratulations! You have won the $200 Raffle Ticket!`;
      const html = `
        <p>Hello ${winner_name},</p>
        <p>Congratulations! You have been selected as the winner of the <b>$200 Raffle Ticket</b> for the event <b>${registration.event_name}</b>.</p>
        <ul>
          <li>🗓 <b>Date:</b> ${registration.event_date}</li>
          <li>🆔 <b>Registration ID:</b> ${winner_id}</li>
          <li>⏰ <b>Won at:</b> ${new Date(spin_time).toLocaleString()}</li>
        </ul>
        <p>Please contact the event organizers to claim your prize.</p>
        <br/>
        <p>Warm regards,<br/>
        Non-Governmental Organization Team<br/>
        📧 NGO@gmail.com | ☎️ 609-937-2800</p>
      `;
      transporter.sendMail({
        from: 'NGO@gmail.com',
        to: registration.email,
        subject,
        html
      }, (err, info) => {
        if (err) console.error('Email send error:', err);
      });
    }
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Save winner error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Save a raffle winner (existing endpoint for backward compatibility)
app.post('/api/raffle/winner', async (req, res) => {
  try {
    const { registration_id, name, phone, email, event_name, event_date } = req.body;
    const won_at = new Date().toISOString();
    
    const [result] = await db.execute(
      'INSERT INTO raffle_winners (registration_id, name, phone, email, event_name, event_date, won_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [registration_id, name, phone, email, event_name, event_date, won_at]
    );
    
    // Send winner notification email
    if (email) {
      let transporter = require('nodemailer').createTransport({
        service: 'gmail',
        auth: {
          user: 'sridanyaravi07@gmail.com',
          pass: 'axkghxaldttnldla'
        }
      });
      const subject = `🎉 Congratulations! You have won the $200 Raffle Ticket!`;
      const html = `
        <p>Hello ${name},</p>
        <p>Congratulations! You have been selected as the winner of the <b>$200 Raffle Ticket</b> for the event <b>${event_name}</b>.</p>
        <ul>
          <li>🗓 <b>Date:</b> ${event_date}</li>
          <li>🆔 <b>Registration ID:</b> ${registration_id}</li>
        </ul>
        <p>Please contact the event organizers to claim your prize.</p>
        <br/>
        <p>Warm regards,<br/>
        Non-Governmental Organization Team<br/>
        📧 NGO@gmail.com | ☎️ 609-937-2800</p>
      `;
      transporter.sendMail({
        from: 'NGO@gmail.com',
        to: email,
        subject,
        html
      }, (err, info) => {
        if (err) console.error('Email send error:', err);
      });
    }
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Save winner error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Add this endpoint after the other raffle endpoints
app.get('/api/raffle/winners', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM raffle_winners ORDER BY won_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Get raffle winners error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET endpoint for raffle winners (matches frontend expectation)
app.get('/api/raffle-winners', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        registration_id,
        name,
        email,
        event_name,
        win_date,
        win_time,
        phone
      FROM raffle_winners
      ORDER BY win_date DESC, win_time DESC
    `);
    console.log('Raffle winners found:', rows.length);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching raffle winners:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// New endpoint for saving raffle winners from spin wheel
app.post('/api/raffle-winners', async (req, res) => {
  try {
    const { registration_id, name, email, phone, event_name, win_date, win_time } = req.body;
    const won_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    const [result] = await db.execute(
      'INSERT INTO raffle_winners (registration_id, name, email, phone, event_name, win_date, win_time, won_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [registration_id, name, email, phone, event_name, win_date, win_time, won_at]
    );
    
    // Send winner notification email
    if (email) {
      let transporter = require('nodemailer').createTransport({
        service: 'gmail',
        auth: {
          user: 'sridanyaravi07@gmail.com',
          pass: 'axkghxaldttnldla'
        }
      });
      
      const subject = `🎉 Congratulations! You have won the Raffle!`;
      const html = `
        <p>Hello ${name},</p>
        <p>Congratulations! You have been selected as the winner of the raffle for the event <b>${event_name}</b>.</p>
        <ul>
          <li>🗓 <b>Date:</b> ${win_date}</li>
          <li>⏰ <b>Time:</b> ${win_time}</li>
          <li>🆔 <b>Registration ID:</b> ${registration_id}</li>
        </ul>
        <p>Please contact the event organizers to claim your prize.</p>
        <br/>
        <p>Warm regards,<br/>
        Non-Governmental Organization Team<br/>
        📧 NGO@gmail.com | ☎️ 609-937-2800</p>
      `;
      
      transporter.sendMail({
        from: 'NGO@gmail.com',
        to: email,
        subject,
        html
      }, (err, info) => {
        if (err) console.error('Email send error:', err);
      });
    }
    
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error saving raffle winner:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on port ${PORT}`);
  console.log('Access from other devices using your computer\'s IP address');
});