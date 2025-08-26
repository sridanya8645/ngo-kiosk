const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateEventSchema() {
  let connection;
  
  try {
    // Create connection using the same method as server.js
    const connectionConfig = {
      host: process.env.DB_HOST || 'ngo-kiosk-mysql.mysql.database.azure.com',
      user: process.env.DB_USER || 'ngo_admin',
      password: process.env.DB_PASSWORD || 'MyApp2024!',
      database: process.env.DB_NAME || 'ngo_kiosk',
      port: process.env.DB_PORT || 3306,
      ssl: {
        rejectUnauthorized: true,
        ca: require('fs').readFileSync(require('path').join(__dirname, 'DigiCertGlobalRootCA.crt.pem'))
      }
    };

    console.log('🔍 Attempting database connection with config:', {
      host: connectionConfig.host,
      user: connectionConfig.user,
      database: connectionConfig.database,
      ssl: !!connectionConfig.ssl
    });

    connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Connected to database');

    // Add new columns to events table
    const alterQueries = [
      { query: "ALTER TABLE events ADD COLUMN banner VARCHAR(255) DEFAULT NULL", errorCode: 'ER_DUP_FIELDNAME' },
      { query: "ALTER TABLE events ADD COLUMN header_image VARCHAR(255) DEFAULT NULL", errorCode: 'ER_DUP_FIELDNAME' },
      { query: "ALTER TABLE events ADD COLUMN footer_content TEXT DEFAULT NULL", errorCode: 'ER_DUP_FIELDNAME' },
      { query: "ALTER TABLE events ADD COLUMN volunteer_enabled BOOLEAN DEFAULT FALSE", errorCode: 'ER_DUP_FIELDNAME' },
      { query: "ALTER TABLE events ADD COLUMN welcome_text TEXT DEFAULT NULL", errorCode: 'ER_DUP_FIELDNAME' }
    ];

    for (const { query, errorCode } of alterQueries) {
      try {
        await connection.execute(query);
        console.log(`✅ Executed: ${query}`);
      } catch (error) {
        if (error.code === errorCode) {
          console.log(`ℹ️ Column already exists: ${query}`);
        } else {
          console.error(`❌ Error executing: ${query}`, error.message);
        }
      }
    }

    // Update existing events with default values
    const updateQueries = [
      "UPDATE events SET volunteer_enabled = FALSE WHERE volunteer_enabled IS NULL",
      "UPDATE events SET welcome_text = CONCAT('Welcome to ', name) WHERE welcome_text IS NULL"
    ];

    for (const query of updateQueries) {
      try {
        await connection.execute(query);
        console.log(`✅ Executed: ${query}`);
      } catch (error) {
        console.error(`❌ Error executing: ${query}`, error.message);
      }
    }

    console.log('✅ Event schema updated successfully');

  } catch (error) {
    console.error('❌ Database connection error:', error);
    console.log('💡 Make sure your .env file has the correct database credentials');
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

updateEventSchema();
