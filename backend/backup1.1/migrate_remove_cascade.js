// backend/migrate_remove_cascade.js
const mysql = require('mysql2/promise');

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ngo_kiosk',
  port: process.env.DB_PORT || 3306
};

async function migrateRemoveCascade() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 1. Rename the old registrations table
    await connection.execute(`RENAME TABLE registrations TO registrations_old`);

    // 2. Create the new registrations table without ON DELETE CASCADE
    await connection.execute(`
      CREATE TABLE registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        phone VARCHAR(255),
        email VARCHAR(255),
        event_id INT,
        checked_in INT DEFAULT 0,
        event_name VARCHAR(255),
        event_date VARCHAR(255),
        interested_to_volunteer VARCHAR(255),
        FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE SET NULL
      )
    `);

    // 3. Copy data from old to new table (exclude registered_at)
    await connection.execute(`
      INSERT INTO registrations (id, name, phone, email, event_id, checked_in, event_name, event_date, interested_to_volunteer)
      SELECT id, name, phone, email, event_id, checked_in, event_name, event_date, interested_to_volunteer FROM registrations_old
    `);

    // 4. Drop the old table
    await connection.execute(`DROP TABLE registrations_old`);

    console.log('Migration complete: ON DELETE CASCADE removed from registrations table.');
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrateRemoveCascade().catch(console.error); 