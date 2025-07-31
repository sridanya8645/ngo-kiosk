const mysql = require('mysql2/promise');

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ngo_kiosk',
  port: process.env.DB_PORT || 3306
};

async function fixCheckinDates() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Fixing checkin dates for existing checked-in records...');

    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

    // Update all records that are checked_in = 1 but have no checkin_date
    const [result] = await connection.execute('UPDATE registrations SET checkin_date = ? WHERE checked_in = 1 AND (checkin_date IS NULL OR checkin_date = "")', [today]);
    console.log('Successfully updated checkin dates for', result.affectedRows, 'records');
    
    // Show the updated records
    const [rows] = await connection.execute('SELECT id, name, checked_in, checkin_date FROM registrations WHERE checked_in = 1');
    console.log('Updated records:');
    rows.forEach(row => {
      console.log(`ID: ${row.id}, Name: ${row.name}, Checked In: ${row.checked_in}, Checkin Date: ${row.checkin_date}`);
    });
    
  } catch (error) {
    console.error('Error fixing checkin dates:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixCheckinDates().catch(console.error); 