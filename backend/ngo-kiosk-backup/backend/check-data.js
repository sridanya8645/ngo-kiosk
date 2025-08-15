require('dotenv').config();
const mysql = require('mysql2/promise');

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ngo_kiosk',
  port: process.env.DB_PORT || 3306
};

async function checkData() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    const today = '2025-07-28'; // Use correct today's date
    console.log(`Checking registrations for date: ${today}`);

    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM registrations WHERE checked_in = 1 AND checkin_date = ?', [today]);
    console.log(`Found ${rows[0].count} registrations with today's check-in date`);
    
    // Also check total registrations
    const [totalRows] = await connection.execute('SELECT COUNT(*) as total FROM registrations');
    console.log(`Total registrations in database: ${totalRows[0].total}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit(0);
  }
}

checkData().catch(console.error); 