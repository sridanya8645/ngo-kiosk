const mysql = require('mysql2/promise');

async function testDB() {
  try {
    console.log('Testing database connection...');
    
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
    
    console.log('✅ Database connection successful');
    
    // Test if tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('Tables found:', tables.map(t => Object.values(t)[0]));
    
    // Test events table
    const [events] = await connection.execute('SELECT COUNT(*) as count FROM events');
    console.log('Events count:', events[0].count);
    
    await connection.end();
    console.log('✅ All tests passed');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

testDB(); 