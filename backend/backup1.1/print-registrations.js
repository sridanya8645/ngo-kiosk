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

async function printRegistrations() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    const [columns] = await connection.execute("SHOW COLUMNS FROM registrations");
    console.log('Registrations Table Schema:');
    console.table(columns);

    const [rows] = await connection.execute('SELECT * FROM registrations');
    console.log('Registrations Data:');
    console.table(rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

printRegistrations().catch(console.error);
