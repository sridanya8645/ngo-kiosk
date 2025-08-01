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
        password VARCHAR(255) NOT NULL
      )
    `);

    // Create events table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        location VARCHAR(255) NOT NULL,
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
      INSERT IGNORE INTO users (username, password) 
      VALUES ('admin', 'admin123')
    `);

    // Insert sample events if not exists
    await connection.execute(`
      INSERT IGNORE INTO events (name, date, time, location, banner) VALUES
      ('Diwali Celebration', '2024-11-12', '18:00:00', 'Community Center', 'diwali-banner.jpg'),
      ('Christmas Party', '2024-12-25', '19:00:00', 'Town Hall', 'christmas-banner.jpg'),
      ('New Year Event', '2025-01-01', '20:00:00', 'City Park', 'newyear-banner.jpg')
    `);

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
