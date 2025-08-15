const mysql = require('mysql2/promise');

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ngo_kiosk',
  port: process.env.DB_PORT || 3306
};

async function addCheckinDateColumn() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    await connection.execute('ALTER TABLE registrations ADD COLUMN checkin_date VARCHAR(255)');
    console.log('Successfully added checkin_date column to registrations table');
    
  } catch (error) {
    console.error('Error adding checkin_date column:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addCheckinDateColumn().catch(console.error); 