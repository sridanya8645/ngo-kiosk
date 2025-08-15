require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ngo_kiosk',
  port: process.env.DB_PORT || 3306
};

async function addTestWinner() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Adding test winner...');
    
    const [result] = await connection.execute(
      'INSERT INTO raffle_winners (registration_id, name, email, phone, event_name, win_date, win_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [1, 'John Smith', 'john.smith@example.com', '555-123-4567', 'Register for Newsletter and General Events', '2025-07-28', '12:00:00']
    );
    
    console.log('✅ Test winner added successfully!');
    
    // Verify
    const [winners] = await connection.execute('SELECT * FROM raffle_winners');
    console.log(`Total winners in database: ${winners.length}`);
    
  } catch (error) {
    console.error('Error adding test winner:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addTestWinner().catch(console.error); 