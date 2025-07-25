// Migration script: Add event_name and event_date columns to registrations table and backfill data
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(__dirname + '/users.db');

db.serialize(() => {
  // 1. Add columns if they don't exist
  db.run(`ALTER TABLE registrations ADD COLUMN event_name TEXT`);
  db.run(`ALTER TABLE registrations ADD COLUMN event_date TEXT`);

  // 2. Backfill event_name and event_date for existing registrations
  db.run(`
    UPDATE registrations
    SET event_name = (
      SELECT name FROM events WHERE events.id = registrations.event_id
    ),
    event_date = (
      SELECT date FROM events WHERE events.id = registrations.event_id
    )
    WHERE event_id IS NOT NULL
  `);

  console.log('Migration complete: event_name and event_date columns added and backfilled.');
});

db.close(); 