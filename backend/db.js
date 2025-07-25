const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(__dirname + '/users.db');

// Create users table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);

  // Insert admin user if not exists
  db.get("SELECT * FROM users WHERE username = ?", ["admin"], (err, row) => {
    if (!row) {
      db.run("INSERT INTO users (username, password) VALUES (?, ?)", ["admin", "password123"]);
    }
  });

  // Insert user if not exists
  db.get("SELECT * FROM users WHERE username = ?", ["user"], (err, row) => {
    if (!row) {
      db.run("INSERT INTO users (username, password) VALUES (?, ?)", ["user", "passw0rd123"]);
    }
  });

  // Create registrations table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT,
      email TEXT,
      event_id INTEGER,
      checked_in INTEGER DEFAULT 0,
      checkin_date TEXT,
      event_name TEXT,
      event_date TEXT,
      registered_at TEXT,
      interested_to_volunteer TEXT,
      FOREIGN KEY(event_id) REFERENCES events(id)
    )
  `);

  // Create events table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      location TEXT NOT NULL,
      banner TEXT
    )
  `);
});

module.exports = db;
