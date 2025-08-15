// backend/create-registrations-table.js
const mysql = require('mysql2/promise');

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ngo_kiosk',
  port: process.env.DB_PORT || 3306
};

async function createRegistrationsTable() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        phone VARCHAR(255),
        email VARCHAR(255),
        event_id INT,
        checked_in INT DEFAULT 0,
        event_name VARCHAR(255),
        event_date VARCHAR(255),
        registered_at VARCHAR(255),
        interested_to_volunteer VARCHAR(255),
        FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE SET NULL
      )
    `);
    
    console.log('registrations table created or already exists.');
    
  } catch (error) {
    console.error('Error creating registrations table:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createRegistrationsTable().catch(console.error); 