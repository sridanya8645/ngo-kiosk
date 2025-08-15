// backend/add-volunteer-column.js
const mysql = require('mysql2/promise');

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ngo_kiosk',
  port: process.env.DB_PORT || 3306
};

async function addVolunteerColumn() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    await connection.execute('ALTER TABLE registrations ADD COLUMN interested_to_volunteer VARCHAR(255)');
    console.log('Added interested_to_volunteer column');
    
  } catch (error) {
    console.error('Error adding interested_to_volunteer column:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addVolunteerColumn().catch(console.error); 