const mysql = require('mysql2/promise');

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ngo_kiosk',
  port: process.env.DB_PORT || 3306
};

async function dropRegistrations() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    await connection.execute('DELETE FROM registrations WHERE event_id IS NULL');
    console.log('Deleted registrations with null event_id');
    
  } catch (error) {
    console.error('Error deleting registrations:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit();
  }
}

dropRegistrations().catch(console.error); 