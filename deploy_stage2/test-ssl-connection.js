const { pool } = require('./db');

async function testConnection() {
  try {
    console.log('🔍 Testing SSL connection to Azure MySQL...');
    
    const connection = await pool.getConnection();
    console.log('✅ SSL connection successful!');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query test successful:', rows);
    
    // Test if tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('✅ Tables found:', tables.map(t => Object.values(t)[0]));
    
    connection.release();
    console.log('✅ All tests passed! SSL connection is working properly.');
    
  } catch (error) {
    console.error('❌ SSL connection test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    process.exit(0);
  }
}

testConnection(); 