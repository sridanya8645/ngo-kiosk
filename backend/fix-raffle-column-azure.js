const mysql = require('mysql2/promise');
require('dotenv').config();

// Use the same connection configuration as the main server
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: false // Disable SSL for Azure connection
});

async function fixRaffleColumn() {
  try {
    console.log('🔧 Fixing raffle_tickets column for Azure...');

    // First check the current column type
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'events' AND COLUMN_NAME = 'raffle_tickets'
    `, [process.env.DB_NAME]);

    console.log('Current raffle_tickets column info:', columns[0]);

    if (columns.length > 0 && columns[0].DATA_TYPE === 'int') {
      // Change raffle_tickets from INT to VARCHAR(255)
      await pool.execute(`
        ALTER TABLE events
        MODIFY COLUMN raffle_tickets VARCHAR(255) DEFAULT ''
      `);

      console.log('✅ Raffle column updated to VARCHAR(255)');

      // Update existing records to have empty string instead of 0
      await pool.execute(`
        UPDATE events
        SET raffle_tickets = ''
        WHERE raffle_tickets = '0' OR raffle_tickets IS NULL
      `);

      console.log('✅ Existing raffle values updated');
    } else {
      console.log('✅ Raffle column is already VARCHAR or doesn\'t exist');
    }

  } catch (error) {
    console.error('❌ Error fixing raffle column:', error);
  } finally {
    await pool.end();
  }
}

fixRaffleColumn();
