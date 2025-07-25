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

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Server error" });
      }
      if (row) {
        res.json({ success: true });
      } else {
        res.status(401).json({ success: false, message: "Invalid username or password" });
      }
    }
  );
});

app.post('/api/register', async (req, res) => {
  console.log("Register endpoint hit");
  const { name, phone, email, event_id, interested_to_volunteer } = req.body;
  console.log("Volunteer value received:", interested_to_volunteer); // Debug log
  if (!name || !phone || !email || !event_id) {
    return res.status(400).json({ error: 'All fields required' });
  }

  // Fetch event details for event_name and event_date
  db.get('SELECT name, date FROM events WHERE id = ?', [event_id], (eventErr, eventRow) => {
    if (eventErr || !eventRow) {
      return res.status(500).json({ error: 'Event not found' });
    }
    const volunteerValue = (interested_to_volunteer || '').trim();
    console.log("Inserting with volunteer value:", volunteerValue);
    db.run(
      'INSERT INTO registrations (name, phone, email, event_id, event_name, event_date, interested_to_volunteer) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, phone, email, event_id, eventRow.name, eventRow.date, volunteerValue],
      async function (err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        const registrationId = this.lastID;
        const qrData = JSON.stringify({ registrationId, name });
        console.log('QR Code data being generated:', qrData); // Debug log
        const qrImage = await QRCode.toDataURL(qrData);
        const base64Data = qrImage.replace(/^data:image\/png;base64,/, "");

        // Prepare email content
        const subject = `✅ Registration Confirmed for ${eventRow.name} at Non-Governmental Organization`;
        const html = `
          <p>Hello ${name},</p>
          <p>You have successfully registered for the event <b>${eventRow.name}</b> at Non-Governmental Organization.</p>
          <ul>
            <li>🗓 <b>Date:</b> ${eventRow.date}</li>
            <li>⏰ <b>Time:</b> ${eventRow.time}</li>
            <li>📍 <b>Venue:</b> Non-Governmental Organization, 12 Perrine Road, Monmouth Junction, NJ 08852</li>
            <li>🆔 <b>Registration ID:</b> ${registrationId}</li>
          </ul>
          <p>Please bring this email and scan the attached QR code at the kiosk during check-in.</p>
          <p>We look forward to welcoming you!</p>
          <br/>
          <p>Warm regards,<br/>
          Non-Governmental Organization Team<br/>
          📧 NGO@gmail.com | ☎️ 609-937-2800</p>
        `;

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
            return res.status(500).json({ error: 'Email failed' });
          }
          res.json({ success: true });
        });
      }
    );
  });
});

// Get all events
app.get('/api/events', (req, res) => {
  db.all('SELECT * FROM events', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

// Add event
app.post('/api/events', upload.single('banner'), (req, res) => {
  const { name, date, time, location } = req.body;
  const banner = req.file ? `/uploads/${req.file.filename}` : null;
  db.run(
    'INSERT INTO events (name, date, time, location, banner) VALUES (?, ?, ?, ?, ?)',
    [name, date, time, location, banner],
    function (err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      db.get('SELECT * FROM events WHERE id = ?', [this.lastID], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true, event: row });
      });
    }
  );
});

// Edit event
app.put('/api/events/:id', upload.single('banner'), (req, res) => {
  const { name, date, time, location } = req.body;
  const { id } = req.params;
  let bannerSql = '';
  let params = [name, date, time, location];
  if (req.file) {
    bannerSql = ', banner = ?';
    params.push(`/uploads/${req.file.filename}`);
  }
  params.push(id);
  db.run(
    `UPDATE events SET name = ?, date = ?, time = ?, location = ?${bannerSql} WHERE id = ?`,
    params,
    function (err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      db.get('SELECT * FROM events WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true, event: row });
      });
    }
  );
});

// Delete event
app.delete('/api/events/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM events WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ success: true });
  });
});

// Serve uploaded banners
app.use('/uploads', express.static(uploadDir));

// New endpoint: Get all registrations with event details
app.get('/api/registrations', (req, res) => {
  const sql = `
    SELECT r.id, r.name, r.phone, r.email, r.event_name, r.event_date, r.checked_in, r.checkin_date, r.interested_to_volunteer
    FROM registrations r
    ORDER BY r.id DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

// New endpoint: Mark a registration as checked in
app.post('/api/registrations/:id/checkin', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  console.log('Check-in attempt for registration id:', id, 'name:', name); // Debug log

  // Fetch registration and its event_id, event_name, and checked_in status
  db.get('SELECT checked_in, event_id, event_name FROM registrations WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('DB error during check-in:', err); // Debug log
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      console.warn('No registration found for id:', id); // Debug log
      return res.status(404).json({ error: 'Registration not found' });
    }

    // Allow check-in for newsletter/general event regardless of date
    if (row.event_name === 'Register for Newsletter and General Events') {
      if (row.checked_in) {
        console.warn('Already scanned for registration id:', id); // Debug log
        return res.json({ success: false, error: "Already scanned" });
      }
      const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
      db.run('UPDATE registrations SET checked_in = 1, checkin_date = ? WHERE id = ?', [today, id], function(err) {
        if (err) {
          console.error('DB error during check-in update:', err); // Debug log
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true, name: name, eventName: row.event_name });
      });
      return;
    }

    // For all other events, check if registration is for today's event
    db.get(`SELECT id FROM events WHERE date = date('now', 'localtime')`, [], (eventErr, eventRow) => {
      if (eventErr) {
        console.error('DB error during event lookup:', eventErr); // Debug log
        return res.status(500).json({ error: 'Database error' });
      }
      if (!eventRow || row.event_id !== eventRow.id) {
        console.warn('QR not valid for this event. Registration event_id:', row.event_id, 'Today event id:', eventRow && eventRow.id); // Debug log
        return res.json({ success: false, error: 'QR not valid for this event' });
      }

      if (row.checked_in) {
        console.warn('Already scanned for registration id:', id); // Debug log
        return res.json({ success: false, error: "Already scanned" });
      }

      const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
      db.run('UPDATE registrations SET checked_in = 1, checkin_date = ? WHERE id = ?', [today, id], function(err) {
        if (err) {
          console.error('DB error during check-in update:', err); // Debug log
          return res.status(500).json({ error: 'Database error' });
        }

        // Fetch event name for success response
        const sql = `
          SELECT e.name AS event_name
          FROM registrations r
          LEFT JOIN events e ON r.event_id = e.id
          WHERE r.id = ?
        `;
        db.get(sql, [id], (detailErr, detailRow) => {
          if (detailErr) {
            console.error('DB error during event name fetch:', detailErr); // Debug log
            return res.status(500).json({ error: 'Database error' });
          }
          res.json({
            success: true,
            name: name,
            eventName: detailRow.event_name
          });
        });
      });
    });
  });
});

// Endpoint: Delete all registrations
app.delete('/api/registrations', (req, res) => {
  db.run('DELETE FROM registrations', function(err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ success: true });
  });
});

// Endpoint: Reset all check-ins (for testing)
app.post('/api/registrations/reset-checkins', (req, res) => {
  db.run('UPDATE registrations SET checked_in = 0', function(err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ success: true, message: 'All check-ins reset' });
  });
});

// Get today's event(s)
app.get('/api/todays-event', (req, res) => {
  const sql = `SELECT * FROM events WHERE date = date('now', 'localtime')`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

// Get eligible users for the raffle (checked-in, not already a winner)
app.get('/api/raffle/eligible-users', (req, res) => {
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
  
  const sql = `
    SELECT r.* FROM registrations r
    WHERE r.checked_in = 1
      AND r.checkin_date = ?
      AND r.id NOT IN (SELECT registration_id FROM raffle_winners)
  `;
  db.all(sql, [today], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

// Save a raffle winner (new endpoint for updated frontend)
app.post('/api/raffle/save-winner', (req, res) => {
  const { winner_id, winner_name, spin_time } = req.body;
  
  // Get the registration details
  db.get('SELECT * FROM registrations WHERE id = ?', [winner_id], (err, registration) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!registration) return res.status(404).json({ error: 'Registration not found' });
    
    const won_at = new Date().toISOString();
    db.run(
      'INSERT INTO raffle_winners (registration_id, name, phone, email, event_name, event_date, won_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [winner_id, winner_name, registration.phone, registration.email, registration.event_name, registration.event_date, won_at],
      function (err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        
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
            // Optionally log or handle errors
            if (err) console.error('Email send error:', err);
          });
        }
        res.json({ success: true, id: this.lastID });
      }
    );
  });
});

// Save a raffle winner (existing endpoint for backward compatibility)
app.post('/api/raffle/winner', (req, res) => {
  const { registration_id, name, phone, email, event_name, event_date } = req.body;
  const won_at = new Date().toISOString();
  db.run(
    'INSERT INTO raffle_winners (registration_id, name, phone, email, event_name, event_date, won_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [registration_id, name, phone, email, event_name, event_date, won_at],
    function (err) {
      if (err) return res.status(500).json({ error: 'Database error' });
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
          // Optionally log or handle errors
        });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Add this endpoint after the other raffle endpoints
app.get('/api/raffle/winners', (req, res) => {
  db.all('SELECT * FROM raffle_winners ORDER BY won_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

// GET endpoint for raffle winners (matches frontend expectation)
app.get('/api/raffle-winners', (req, res) => {
  db.all(`
    SELECT 
      rw.registration_id,
      rw.name,
      rw.email,
      rw.event_name,
      rw.win_date,
      rw.win_time,
      r.phone
    FROM raffle_winners rw
    LEFT JOIN registrations r ON rw.registration_id = r.id
    ORDER BY rw.win_date DESC, rw.win_time DESC
  `, [], (err, rows) => {
    if (err) {
      console.error('Error fetching raffle winners:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// New endpoint for saving raffle winners from spin wheel
app.post('/api/raffle-winners', (req, res) => {
  const { registration_id, name, email, event_name, win_date, win_time } = req.body;
  const won_at = new Date().toISOString();
  
  db.run(
    'INSERT INTO raffle_winners (registration_id, name, email, event_name, win_date, win_time, won_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [registration_id, name, email, event_name, win_date, win_time, won_at],
    function (err) {
      if (err) {
        console.error('Error saving raffle winner:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
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
      
      res.json({ success: true, id: this.lastID });
    }
  );
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