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

async function checkAdmin() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Checking admin user in database...');

    // Check if admin user exists
    const [rows] = await connection.execute("SELECT * FROM users WHERE username = ?", ["admin"]);
    
    if (rows.length > 0) {
      console.log('✅ Admin user found:');
      console.log('Username:', rows[0].username);
      console.log('Password:', rows[0].password);
    } else {
      console.log('❌ Admin user not found, creating...');
      await connection.execute("INSERT INTO users (username, password) VALUES (?, ?)", ["admin", "password123"]);
      console.log('✅ Admin user created successfully');
    }

    // Test login with admin credentials
    const [loginRows] = await connection.execute("SELECT * FROM users WHERE username = ? AND password = ?", ["admin", "password123"]);
    
    if (loginRows.length > 0) {
      console.log('✅ Login test successful - admin credentials work');
    } else {
      console.log('❌ Login test failed - admin credentials do not work');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkAdmin().catch(console.error); 