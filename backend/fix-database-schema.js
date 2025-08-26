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

async function fixDatabaseSchema() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database successfully!');

    // Check current table structure
    console.log('\nChecking current events table structure...');
    const [columns] = await connection.execute('DESCRIBE events');
    console.log('Current columns:', columns.map(col => col.Field));

    // Fix column names and add missing columns
    const alterQueries = [
      // Rename old columns to new names
      { query: "ALTER TABLE events CHANGE COLUMN date start_datetime DATETIME", errorCode: 'ER_BAD_FIELD_ERROR' },
      { query: "ALTER TABLE events CHANGE COLUMN header_content header_image VARCHAR(255)", errorCode: 'ER_BAD_FIELD_ERROR' },
      
      // Add missing columns if they don't exist
      { query: "ALTER TABLE events ADD COLUMN banner VARCHAR(255) DEFAULT NULL", errorCode: 'ER_DUP_FIELDNAME' },
      { query: "ALTER TABLE events ADD COLUMN footer_content TEXT DEFAULT NULL", errorCode: 'ER_DUP_FIELDNAME' },
      { query: "ALTER TABLE events ADD COLUMN volunteer_enabled BOOLEAN DEFAULT FALSE", errorCode: 'ER_DUP_FIELDNAME' },
      { query: "ALTER TABLE events ADD COLUMN welcome_text TEXT DEFAULT NULL", errorCode: 'ER_DUP_FIELDNAME' },
      { query: "ALTER TABLE events ADD COLUMN created_by INT DEFAULT NULL", errorCode: 'ER_DUP_FIELDNAME' },
      { query: "ALTER TABLE events ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP", errorCode: 'ER_DUP_FIELDNAME' },
      { query: "ALTER TABLE events ADD COLUMN modified_by INT DEFAULT NULL", errorCode: 'ER_DUP_FIELDNAME' },
      { query: "ALTER TABLE events ADD COLUMN modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP", errorCode: 'ER_DUP_FIELDNAME' }
    ];

    for (const { query, errorCode } of alterQueries) {
      try {
        console.log(`Executing: ${query}`);
        await connection.execute(query);
        console.log('✅ Success');
      } catch (error) {
        if (error.code === errorCode) {
          console.log(`⚠️  Skipped (${errorCode}): ${error.message}`);
        } else {
          console.log(`❌ Error: ${error.message}`);
        }
      }
    }

    // Update existing records to have proper datetime format
    console.log('\nUpdating existing records...');
    try {
      await connection.execute(`
        UPDATE events 
        SET start_datetime = CONCAT(DATE(start_datetime), ' 00:00:00')
        WHERE start_datetime IS NOT NULL AND TIME(start_datetime) = '00:00:00'
      `);
      console.log('✅ Updated start_datetime records');
    } catch (error) {
      console.log(`⚠️  Start datetime update: ${error.message}`);
    }

    try {
      await connection.execute(`
        UPDATE events 
        SET end_datetime = CONCAT(DATE(end_datetime), ' 23:59:59')
        WHERE end_datetime IS NOT NULL AND TIME(end_datetime) = '00:00:00'
      `);
      console.log('✅ Updated end_datetime records');
    } catch (error) {
      console.log(`⚠️  End datetime update: ${error.message}`);
    }

    // Show final table structure
    console.log('\nFinal events table structure:');
    const [finalColumns] = await connection.execute('DESCRIBE events');
    finalColumns.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    console.log('\n✅ Database schema fixed successfully!');

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

fixDatabaseSchema();
