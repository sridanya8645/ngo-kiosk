const mysql = require('mysql2/promise');

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ngo_kiosk',
  port: process.env.DB_PORT || 3306
};

async function clearRegistrations() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Clearing all registrations...');
    
    const [result] = await connection.execute('DELETE FROM registrations');
    console.log('Successfully cleared all registrations from the table');
    console.log('Rows deleted:', result.affectedRows);
    
  } catch (error) {
    console.error('Error clearing registrations:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

clearRegistrations().catch(console.error); 