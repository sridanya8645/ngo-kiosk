// backend/create-registrations-table.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(__dirname + '/users.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT,
      email TEXT,
      event_id INTEGER,
      checked_in INTEGER DEFAULT 0,
      event_name TEXT,
      event_date TEXT,
      registered_at TEXT,
      interested_to_volunteer TEXT,
      FOREIGN KEY(event_id) REFERENCES events(id)
    )
  `, (err) => {
    if (err) console.error('Error creating registrations table:', err);
    else console.log('registrations table created or already exists.');
    db.close();
  });
}); 