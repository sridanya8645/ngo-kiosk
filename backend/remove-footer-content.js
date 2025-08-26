const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'ngo-kiosk-mysql.mysql.database.azure.com',
  user: 'ngo_admin',
  password: 'MyApp2024!',
  database: 'ngo_kiosk',
  ssl: {
    ca: require('fs').readFileSync('./DigiCertGlobalRootCA.crt.pem')
  }
};

async function removeFooterContentColumn() {
  let connection;
  
  try {
    console.log('🔌 Connecting to Azure MySQL database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully!');

    // Remove footer_content column
    console.log('🗑️ Removing footer_content column from events table...');
    try {
      await connection.execute('ALTER TABLE events DROP COLUMN footer_content');
      console.log('✅ footer_content column removed successfully!');
    } catch (error) {
      if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('ℹ️ footer_content column does not exist, skipping...');
      } else {
        throw error;
      }
    }

    console.log('✅ Database schema updated successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed.');
    }
  }
}

removeFooterContentColumn();
