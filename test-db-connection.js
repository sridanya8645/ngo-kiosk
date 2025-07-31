// Test Database Connection Script for Azure MySQL
const mysql = require('mysql2/promise');

async function testConnection() {
  const dbConfig = {
    host: 'ngo-kiosk-mysql.mysql.database.azure.com',
    user: 'ngo_admin@ngo-kiosk-mysql',
    password: 'MyApp2024!',
    database: 'ngo_kiosk',
    port: 3306,
    ssl: {
      rejectUnauthorized: false
    }
  };

  try {
    console.log('Testing Azure MySQL database connection...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query test successful:', rows);
    
    await connection.end();
    console.log('✅ Connection closed successfully');
    
    console.log('\n🎉 Your Azure MySQL Database is ready!');
    console.log('Server: ngo-kiosk-mysql.mysql.database.azure.com');
    console.log('Database: ngo_kiosk');
    console.log('Username: ngo_admin@ngo-kiosk-mysql');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure the MySQL database is created in Azure');
    console.log('2. Check firewall rules allow Azure services (0.0.0.0/0)');
    console.log('3. Verify the connection string is correct');
    console.log('4. Ensure the database "ngo_kiosk" exists');
  }
}

testConnection(); 