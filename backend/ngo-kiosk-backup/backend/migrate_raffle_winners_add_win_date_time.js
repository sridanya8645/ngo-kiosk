const mysql = require('mysql2/promise');

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ngo_kiosk',
  port: process.env.DB_PORT || 3306
};

async function migrateRaffleWinnersAddWinDateTime() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Add win_date and win_time columns to raffle_winners table
    try {
      await connection.execute(`ALTER TABLE raffle_winners ADD COLUMN win_date VARCHAR(255)`);
      console.log('win_date column added successfully');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('win_date column already exists');
      } else {
        console.error('Error adding win_date column:', error);
      }
    }
    
    try {
      await connection.execute(`ALTER TABLE raffle_winners ADD COLUMN win_time VARCHAR(255)`);
      console.log('win_time column added successfully');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('win_time column already exists');
      } else {
        console.error('Error adding win_time column:', error);
      }
    }
    
    // Update existing records to have win_date and win_time
    await connection.execute(`UPDATE raffle_winners SET win_date = DATE(won_at), win_time = TIME(won_at) WHERE win_date IS NULL`);
    console.log('Existing records updated with win_date and win_time');
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit(0);
  }
}

migrateRaffleWinnersAddWinDateTime().catch(console.error); 