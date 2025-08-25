require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Azure MySQL Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'ngo-kiosk-mysql.mysql.database.azure.com',
  user: process.env.DB_USER || 'ngo_admin',
  password: process.env.DB_PASSWORD || 'MyApp2024!',
  database: process.env.DB_NAME || 'ngo_kiosk',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(path.join(__dirname, 'DigiCertGlobalRootCA.crt.pem'))
  }
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Initialize database and create tables
async function initializeDatabase() {
  try {
    // Connect to the database (Azure MySQL requires database to exist)
    const connection = await pool.getConnection();
    
    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        totp_secret VARCHAR(255),
        admin_id VARCHAR(50) UNIQUE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Create events table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        end_date DATE,
        end_time TIME,
        location VARCHAR(255) NOT NULL,
        raffle_tickets INT DEFAULT 0,
        banner VARCHAR(500)
      )
    `);

    // Create registrations table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255) NOT NULL,
        event_id INT,
        event_name VARCHAR(255),
        event_date DATE,
        interested_to_volunteer BOOLEAN DEFAULT FALSE,
        checked_in BOOLEAN DEFAULT FALSE,
        checkin_date DATETIME,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
      )
    `);

    // Create raffle_winners table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS raffle_winners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        registration_id INT,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255) NOT NULL,
        event_name VARCHAR(255),
        win_date DATE,
        win_time TIME,
        won_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE SET NULL
      )
    `);

    // Insert default admin user if not exists
    await connection.execute(`
      INSERT IGNORE INTO users (username, password, admin_id) 
      VALUES ('admin', 'admin123', 'ADMIN001')
    `);

    // Ensure totp_secret column exists (in case table was created before this column was added)
    try {
      await connection.execute(`
        ALTER TABLE users ADD COLUMN totp_secret VARCHAR(255)
      `);
    } catch (error) {
      // Column already exists, ignore error
      console.log('totp_secret column already exists');
    }

    // Ensure events table has all required columns
    try {
      await connection.execute(`
        ALTER TABLE events ADD COLUMN end_date DATE
      `);
    } catch (error) {
      console.log('end_date column already exists');
    }

    try {
      await connection.execute(`
        ALTER TABLE events ADD COLUMN end_time TIME
      `);
    } catch (error) {
      console.log('end_time column already exists');
    }

    try {
      await connection.execute(`
        ALTER TABLE events ADD COLUMN raffle_tickets INT DEFAULT 0
      `);
    } catch (error) {
      console.log('raffle_tickets column already exists');
    }

    // Removed sample events insertion - events should only be added through admin interface
    // This prevents deleted events from reappearing after server restart

    connection.release();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

// Export the pool and initialization function
module.exports = {
  pool,
  initializeDatabase
};
