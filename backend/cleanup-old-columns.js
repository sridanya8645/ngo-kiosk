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

async function cleanupOldColumns() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database successfully!');

    // Remove old columns that are no longer needed
    const dropQueries = [
      "ALTER TABLE events DROP COLUMN date",
      "ALTER TABLE events DROP COLUMN time", 
      "ALTER TABLE events DROP COLUMN end_date",
      "ALTER TABLE events DROP COLUMN end_time",
      "ALTER TABLE events DROP COLUMN header_content"
    ];

    for (const query of dropQueries) {
      try {
        console.log(`Executing: ${query}`);
        await connection.execute(query);
        console.log('✅ Success');
      } catch (error) {
        console.log(`⚠️  Skipped: ${error.message}`);
      }
    }

    // Show final table structure
    console.log('\nFinal events table structure:');
    const [finalColumns] = await connection.execute('DESCRIBE events');
    finalColumns.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    console.log('\n✅ Old columns cleaned up successfully!');

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

cleanupOldColumns();
