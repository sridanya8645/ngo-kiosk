const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'ngo-kiosk-mysql.mysql.database.azure.com',
  user: 'ngo_admin',
  password: 'MyApp2024!',
  database: 'ngo_kiosk',
  ssl: {
    ca: require('fs').readFileSync('./DigiCertGlobalRootCA.crt.pem')
  }
};

async function addFooterFields() {
  let connection;
  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Add footer fields to events table
    const alterQueries = [
      { query: "ALTER TABLE events ADD COLUMN footer_location VARCHAR(255) DEFAULT NULL", errorCode: 'ER_DUP_FIELDNAME' },
      { query: "ALTER TABLE events ADD COLUMN footer_phone VARCHAR(50) DEFAULT NULL", errorCode: 'ER_DUP_FIELDNAME' },
      { query: "ALTER TABLE events ADD COLUMN footer_email VARCHAR(255) DEFAULT NULL", errorCode: 'ER_DUP_FIELDNAME' }
    ];

    for (const { query, errorCode } of alterQueries) {
      try {
        await connection.execute(query);
        console.log(`✅ Executed: ${query}`);
      } catch (error) {
        if (error.code === errorCode) {
          console.log(`⚠️ Column already exists, skipping: ${query}`);
        } else {
          console.error(`❌ Error executing query: ${query}`, error.message);
        }
      }
    }

    console.log('✅ Footer fields added successfully');
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

addFooterFields();
