// Database migration script to fix table structures
const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixTableStructures() {
  let connection;
  
  try {
    console.log('🔄 Starting database table structure fixes...');
    
    // Create database connection
    const dbConfig = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL_CA_PATH ? {
        rejectUnauthorized: true,
        ca: require('fs').readFileSync(process.env.DB_SSL_CA_PATH)
      } : false
    };
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected');
    
    // Fix events table structure
    console.log('🔄 Fixing events table structure...');
    
    // Check current table structure
    const [eventColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'events'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'ngo_kiosk']);
    
    console.log('Current events table columns:', eventColumns.map(col => col.COLUMN_NAME));
    
    // Add missing columns if they don't exist
    const requiredColumns = [
      { name: 'start_datetime', type: 'DATETIME', nullable: 'NO' },
      { name: 'end_datetime', type: 'DATETIME', nullable: 'NO' },
      { name: 'header_image', type: 'VARCHAR(500)', nullable: 'YES' },
      { name: 'footer_location', type: 'VARCHAR(500)', nullable: 'YES' },
      { name: 'footer_phone', type: 'VARCHAR(50)', nullable: 'YES' },
      { name: 'footer_email', type: 'VARCHAR(255)', nullable: 'YES' },
      { name: 'volunteer_enabled', type: 'BOOLEAN', nullable: 'YES', default: 'FALSE' },
      { name: 'welcome_text', type: 'TEXT', nullable: 'YES' },
      { name: 'created_by', type: 'INT', nullable: 'YES' },
      { name: 'modified_by', type: 'INT', nullable: 'YES' },
      { name: 'created_at', type: 'TIMESTAMP', nullable: 'YES', default: 'CURRENT_TIMESTAMP' },
      { name: 'modified_at', type: 'TIMESTAMP', nullable: 'YES', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    ];
    
    const existingColumns = eventColumns.map(col => col.COLUMN_NAME);
    
    for (const column of requiredColumns) {
      if (!existingColumns.includes(column.name)) {
        console.log(`Adding column: ${column.name}`);
        let sql = `ALTER TABLE events ADD COLUMN ${column.name} ${column.type}`;
        if (column.nullable === 'NO') {
          sql += ' NOT NULL';
        }
        if (column.default) {
          sql += ` DEFAULT ${column.default}`;
        }
        await connection.execute(sql);
      }
    }
    
    // Migrate old date/time data to new datetime format if needed
    if (existingColumns.includes('date') && existingColumns.includes('time') && existingColumns.includes('start_datetime')) {
      console.log('🔄 Migrating old date/time data to new datetime format...');
      await connection.execute(`
        UPDATE events 
        SET start_datetime = CONCAT(date, ' ', time),
            end_datetime = CONCAT(COALESCE(end_date, date), ' ', COALESCE(end_time, time))
        WHERE start_datetime IS NULL OR end_datetime IS NULL
      `);
    }
    
    // Change raffle_tickets to VARCHAR if it's INT
    const raffleColumn = eventColumns.find(col => col.COLUMN_NAME === 'raffle_tickets');
    if (raffleColumn && raffleColumn.DATA_TYPE === 'int') {
      console.log('🔄 Converting raffle_tickets column to VARCHAR...');
      await connection.execute(`ALTER TABLE events MODIFY COLUMN raffle_tickets VARCHAR(255) DEFAULT ''`);
    }
    
    // Fix raffle_winners table structure
    console.log('🔄 Fixing raffle_winners table structure...');
    
    const [raffleColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'raffle_winners'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'ngo_kiosk']);
    
    console.log('Current raffle_winners table columns:', raffleColumns.map(col => col.COLUMN_NAME));
    
    const existingRaffleColumns = raffleColumns.map(col => col.COLUMN_NAME);
    
    // Add prize column if it doesn't exist
    if (!existingRaffleColumns.includes('prize')) {
      console.log('Adding prize column to raffle_winners table...');
      await connection.execute(`ALTER TABLE raffle_winners ADD COLUMN prize VARCHAR(255)`);
    }
    
    // Update foreign key constraint to CASCADE
    console.log('🔄 Updating foreign key constraints...');
    try {
      await connection.execute(`
        ALTER TABLE raffle_winners 
        DROP FOREIGN KEY raffle_winners_ibfk_1
      `);
    } catch (error) {
      console.log('Foreign key constraint not found or already updated');
    }
    
    try {
      await connection.execute(`
        ALTER TABLE raffle_winners 
        ADD CONSTRAINT raffle_winners_ibfk_1 
        FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
      `);
    } catch (error) {
      console.log('Foreign key constraint already exists');
    }
    
    // Make registration_id NOT NULL
    try {
      await connection.execute(`ALTER TABLE raffle_winners MODIFY COLUMN registration_id INT NOT NULL`);
    } catch (error) {
      console.log('registration_id already NOT NULL or has data conflicts');
    }
    
    console.log('✅ Database table structure fixes completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing table structures:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  fixTableStructures()
    .then(() => {
      console.log('🎉 Table structure migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { fixTableStructures };
