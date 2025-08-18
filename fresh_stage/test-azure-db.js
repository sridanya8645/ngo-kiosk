const mysql = require('mysql2/promise');

async function testAzureDatabase() {
  try {
    console.log('🔧 Testing Azure MySQL Database connection...');
    
    const connection = await mysql.createConnection({
      host: 'ngo-kiosk-mysql.mysql.database.azure.com',
      user: 'ngo_admin',
      password: 'MyApp2024!',
      database: 'ngo_kiosk',
      port: 3306,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    console.log('✅ Connected to Azure MySQL Database');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM events');
    console.log('✅ Events table has', rows[0].count, 'records');
    
    // Test users table
    const [userRows] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log('✅ Users table has', userRows[0].count, 'records');
    
    // Test registrations table
    const [regRows] = await connection.execute('SELECT COUNT(*) as count FROM registrations');
    console.log('✅ Registrations table has', regRows[0].count, 'records');
    
    await connection.end();
    console.log('🎉 Azure MySQL Database is working correctly!');
    
  } catch (error) {
    console.error('❌ Azure MySQL Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check if Azure MySQL Database is running');
    console.log('   2. Verify firewall rules allow Azure App Service');
    console.log('   3. Check username and password');
    console.log('   4. Verify database exists');
  }
}

testAzureDatabase(); 