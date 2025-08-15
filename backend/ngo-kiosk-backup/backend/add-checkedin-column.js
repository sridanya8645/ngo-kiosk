const mysql = require('mysql2/promise');

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ngo_kiosk',
  port: process.env.DB_PORT || 3306
};

async function addCheckedInColumn() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    await connection.execute('ALTER TABLE registrations ADD COLUMN checked_in INT DEFAULT 0');
    console.log('Added checked_in column');
    
  } catch (error) {
    console.error('Error adding checked_in column:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit();
  }
}

addCheckedInColumn().catch(console.error);
