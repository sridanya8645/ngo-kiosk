// Migration script: Add event_name and event_date columns to registrations table and backfill data
const mysql = require('mysql2/promise');

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ngo_kiosk',
  port: process.env.DB_PORT || 3306
};

async function migrateAddEventNameDate() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 1. Add columns if they don't exist
    await connection.execute(`ALTER TABLE registrations ADD COLUMN event_name VARCHAR(255)`);
    await connection.execute(`ALTER TABLE registrations ADD COLUMN event_date VARCHAR(255)`);

    // 2. Backfill event_name and event_date for existing registrations
    await connection.execute(`
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
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrateAddEventNameDate().catch(console.error); 