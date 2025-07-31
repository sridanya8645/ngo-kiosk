require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ngo_kiosk',
  port: process.env.DB_PORT || 3306
};

// Use July 28th as today's date
const today = '2025-07-28';

async function fixTodaysDate() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    console.log(`Updating all checked-in registrations to use date: ${today}`);
    
    // Update all registrations that are checked_in = 1 to use today's correct date
    const [result] = await connection.execute(
      'UPDATE registrations SET checkin_date = ? WHERE checked_in = 1', 
      [today]
    );
    
    console.log(`Successfully updated ${result.affectedRows} registrations to today's date`);
    
    // Verify the update
    const [verifyRows] = await connection.execute(
      'SELECT COUNT(*) as count FROM registrations WHERE checked_in = 1 AND checkin_date = ?', 
      [today]
    );
    
    console.log(`Verified: ${verifyRows[0].count} registrations with today's check-in date`);
    
  } catch (error) {
    console.error('Error fixing today\'s date:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixTodaysDate().catch(console.error); 