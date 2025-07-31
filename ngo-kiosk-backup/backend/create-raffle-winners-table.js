const mysql = require('mysql2/promise');

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ngo_kiosk',
  port: process.env.DB_PORT || 3306
};

async function createRaffleWinnersTable() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS raffle_winners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        registration_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        event_name VARCHAR(255) NOT NULL,
        event_date VARCHAR(255) NOT NULL,
        won_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (registration_id) REFERENCES registrations (id) ON DELETE SET NULL
      )
    `);
    
    console.log('raffle_winners table created successfully or already exists');
    
  } catch (error) {
    console.error('Error creating raffle_winners table:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit(0);
  }
}

createRaffleWinnersTable().catch(console.error); 