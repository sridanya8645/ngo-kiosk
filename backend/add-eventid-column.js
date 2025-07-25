const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./users.db');

db.run('ALTER TABLE registrations ADD COLUMN event_id INTEGER', (err) => {
  if (err) {
    console.error('Error adding event_id column:', err);
  } else {
    console.log('event_id column added successfully.');
  }
  db.close();
}); 