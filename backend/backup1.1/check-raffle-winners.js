const mysql = require('mysql2/promise');

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ngo_kiosk',
  port: process.env.DB_PORT || 3306
};

async function checkRaffleWinners() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Checking raffle_winners table...\n');

    // Check if table exists and get its structure
    const [columns] = await connection.execute("SHOW COLUMNS FROM raffle_winners");
    console.log('Raffle Winners Table Schema:');
    console.table(columns);
    
    // Check if there's any data in the table
    const [rows] = await connection.execute('SELECT * FROM raffle_winners');
    console.log('\nRaffle Winners Data:');
    if (rows.length === 0) {
      console.log('No raffle winners found in the database.');
      console.log('This is why the page shows "Failed to load winners."');
    } else {
      console.table(rows);
    }
    
    // Also check the API endpoints
    console.log('\nAvailable API endpoints for raffle winners:');
    console.log('- /api/raffle-winners (GET)');
    console.log('- /api/raffle/winners (GET)');
    console.log('- /api/raffle-winners (POST)');
    
  } catch (error) {
    console.error('Error checking table structure:', error);
    console.log('Table might not exist. Creating it...');
    
    try {
      // Create the table if it doesn't exist
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS raffle_winners (
          id INT AUTO_INCREMENT PRIMARY KEY,
          registration_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          event_name VARCHAR(255) NOT NULL,
          event_date VARCHAR(255) NOT NULL,
          won_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          win_date VARCHAR(255),
          win_time VARCHAR(255),
          FOREIGN KEY (registration_id) REFERENCES registrations (id) ON DELETE SET NULL
        )
      `);
      console.log('raffle_winners table created successfully');
      
      // Check data again after creation
      const [rows] = await connection.execute('SELECT * FROM raffle_winners');
      console.log('\nRaffle Winners Data:');
      if (rows.length === 0) {
        console.log('No raffle winners found in the database.');
        console.log('This is why the page shows "Failed to load winners."');
      } else {
        console.table(rows);
      }
    } catch (createError) {
      console.error('Error creating table:', createError);
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkRaffleWinners().catch(console.error); 