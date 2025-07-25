// backend/migrate_remove_cascade.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(__dirname + '/users.db');

db.serialize(() => {
  // 1. Rename the old registrations table
  db.run(`ALTER TABLE registrations RENAME TO registrations_old`);

  // 2. Create the new registrations table without ON DELETE CASCADE
  db.run(`
    CREATE TABLE registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT,
      email TEXT,
      event_id INTEGER,
      checked_in INTEGER DEFAULT 0,
      event_name TEXT,
      event_date TEXT,
      interested_to_volunteer TEXT,
      FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE SET NULL
    )
  `);

  // 3. Copy data from old to new table (exclude registered_at)
  db.run(`
    INSERT INTO registrations (id, name, phone, email, event_id, checked_in, event_name, event_date, interested_to_volunteer)
    SELECT id, name, phone, email, event_id, checked_in, event_name, event_date, interested_to_volunteer FROM registrations_old
  `);

  // 4. Drop the old table
  db.run(`DROP TABLE registrations_old`);

  console.log('Migration complete: ON DELETE CASCADE removed from registrations table.');
  db.close();
}); 