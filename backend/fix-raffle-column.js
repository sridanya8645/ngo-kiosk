const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: true, ca: require('fs').readFileSync(process.env.DB_SSL_CA_PATH) }
});

async function fixRaffleColumn() {
  try {
    console.log('🔧 Fixing raffle_tickets column...');
    
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
    
  } catch (error) {
    console.error('❌ Error fixing raffle column:', error);
  } finally {
    await pool.end();
  }
}

fixRaffleColumn();
