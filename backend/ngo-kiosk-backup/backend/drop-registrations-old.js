const mysql = require('mysql2/promise');

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ngo_kiosk',
  port: process.env.DB_PORT || 3306
};

async function dropRegistrationsOld() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    await connection.execute('DROP TABLE IF EXISTS registrations_old');
    console.log('Dropped registrations_old table');
    
  } catch (error) {
    console.error('Error dropping registrations_old table:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

dropRegistrationsOld().catch(console.error); 