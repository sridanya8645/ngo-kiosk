const mysql = require('mysql2/promise');

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ngo_kiosk',
  port: process.env.DB_PORT || 3306
};

async function addEventIdColumn() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    await connection.execute('ALTER TABLE registrations ADD COLUMN event_id INT');
    console.log('event_id column added successfully.');
    
  } catch (error) {
    console.error('Error adding event_id column:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addEventIdColumn().catch(console.error); 