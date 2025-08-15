require('dotenv').config();
// Script to list all tables in the database
const mysql = require('mysql2/promise');

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ngo_kiosk',
  port: process.env.DB_PORT || 3306
};

async function listTables() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute("SHOW TABLES");
    console.log('Tables in database:');
    rows.forEach(row => {
      const tableName = Object.values(row)[0];
      console.log(tableName);
    });
    
  } catch (error) {
    console.error('Error listing tables:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

listTables().catch(console.error); 