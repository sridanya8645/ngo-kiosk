const db = require('./db');

db.run(`
  CREATE TABLE IF NOT EXISTS raffle_winners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    event_name TEXT NOT NULL,
    event_date TEXT NOT NULL,
    won_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (registration_id) REFERENCES registrations (id)
  )
`, (err) => {
  if (err) {
    console.error('Error creating raffle_winners table:', err);
  } else {
    console.log('raffle_winners table created successfully or already exists');
  }
  process.exit(0);
}); 