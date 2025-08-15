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
    
    // Test table creation
    console.log('Testing table creation...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS test_table (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255)
      )
    `);
    console.log('✅ Table creation test successful');
    
    // Clean up test table
    await connection.execute('DROP TABLE IF EXISTS test_table');
    console.log('✅ Cleanup successful');
    
    await connection.end();
    console.log('✅ Connection closed successfully');
    
    console.log('\n🎉 Azure MySQL Database is ready for deployment!');
    console.log('📋 Connection Details:');
    console.log('   Host: ngo-kiosk-mysql.mysql.database.azure.com');
    console.log('   Database: ngo_kiosk');
    console.log('   Username: ngo_admin@ngo-kiosk-mysql');
    console.log('   Password: MyApp2024!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure Azure MySQL Database is created');
    console.log('   2. Check firewall rules allow connections');
    console.log('   3. Verify server name and credentials');
  }
}

testConnection(); 