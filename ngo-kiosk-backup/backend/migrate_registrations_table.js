// Migration script for MySQL: Remove ON DELETE CASCADE from registrations table
// and use ON DELETE SET NULL instead.
const mysql = require('mysql2/promise');

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ngo_kiosk',
  port: process.env.DB_PORT || 3306
};

async function migrateRegistrationsTable() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 1. Rename the old registrations table
    await connection.execute(`RENAME TABLE registrations TO registrations_old`);

    // 2. Create the new registrations table (adjust columns as needed)
    await connection.execute(`
      CREATE TABLE registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(255),
        event_id INT,
        checked_in INT DEFAULT 0,
        registered_at VARCHAR(255),
        interested_to_volunteer VARCHAR(255),
        FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE SET NULL
      )
    `);

    // 3. Copy data from old to new table
    await connection.execute(`
      INSERT INTO registrations (id, name, email, phone, event_id, checked_in, registered_at, interested_to_volunteer)
      SELECT id, name, email, phone, event_id, checked_in, registered_at, interested_to_volunteer FROM registrations_old
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

migrateRegistrationsTable().catch(console.error); 