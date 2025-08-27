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

    // Create events table with proper structure
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        start_datetime DATETIME NOT NULL,
        end_datetime DATETIME NOT NULL,
        location VARCHAR(500) NOT NULL,
        raffle_tickets VARCHAR(255) DEFAULT '',
        banner VARCHAR(500),
        header_image VARCHAR(500),
        footer_location VARCHAR(500),
        footer_phone VARCHAR(50),
        footer_email VARCHAR(255),
        volunteer_enabled BOOLEAN DEFAULT FALSE,
        welcome_text TEXT,
        created_by INT,
        modified_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (modified_by) REFERENCES users(id) ON DELETE SET NULL
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

    // Create raffle_winners table with proper structure
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS raffle_winners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        registration_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255) NOT NULL,
        event_name VARCHAR(255) NOT NULL,
        win_date DATE NOT NULL,
        win_time TIME NOT NULL,
        won_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        prize VARCHAR(255),
        FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
      )
    `);

    // No default admin user creation - all users will be created through the UI
    console.log('ℹ️ No default admin user created - use the admin interface to create users');

    // Ensure totp_secret column exists (in case table was created before this column was added)
    try {
      await connection.execute(`
        ALTER TABLE users ADD COLUMN totp_secret VARCHAR(255)
      `);
    } catch (error) {
      // Column already exists, ignore error
      console.log('totp_secret column already exists');
    }

    // Migrate events table to new structure
    try {
      // Check if old columns exist and migrate data
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'events'
      `, [process.env.DB_NAME || 'ngo_kiosk']);
      
      const columnNames = columns.map(col => col.COLUMN_NAME);
      
      // If old structure exists, migrate to new structure
      if (columnNames.includes('date') && columnNames.includes('time') && !columnNames.includes('start_datetime')) {
        console.log('🔄 Migrating events table to new structure...');
        
        // Add new columns
        await connection.execute(`ALTER TABLE events ADD COLUMN start_datetime DATETIME`);
        await connection.execute(`ALTER TABLE events ADD COLUMN end_datetime DATETIME`);
        await connection.execute(`ALTER TABLE events ADD COLUMN header_image VARCHAR(500)`);
        await connection.execute(`ALTER TABLE events ADD COLUMN footer_location VARCHAR(500)`);
        await connection.execute(`ALTER TABLE events ADD COLUMN footer_phone VARCHAR(50)`);
        await connection.execute(`ALTER TABLE events ADD COLUMN footer_email VARCHAR(255)`);
        await connection.execute(`ALTER TABLE events ADD COLUMN volunteer_enabled BOOLEAN DEFAULT FALSE`);
        await connection.execute(`ALTER TABLE events ADD COLUMN welcome_text TEXT`);
        await connection.execute(`ALTER TABLE events ADD COLUMN created_by INT`);
        await connection.execute(`ALTER TABLE events ADD COLUMN modified_by INT`);
        await connection.execute(`ALTER TABLE events ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        await connection.execute(`ALTER TABLE events ADD COLUMN modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
        
        // Migrate existing data
        await connection.execute(`
          UPDATE events 
          SET start_datetime = CONCAT(date, ' ', time),
              end_datetime = CONCAT(COALESCE(end_date, date), ' ', COALESCE(end_time, time))
        `);
        
        // Change raffle_tickets to VARCHAR if it's INT
        if (columnNames.includes('raffle_tickets')) {
          await connection.execute(`ALTER TABLE events MODIFY COLUMN raffle_tickets VARCHAR(255) DEFAULT ''`);
        }
        
        console.log('✅ Events table migration completed');
      }
    } catch (error) {
      console.log('Events table migration error (may already be migrated):', error.message);
    }

    // Migrate raffle_winners table to new structure
    try {
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'raffle_winners'
      `, [process.env.DB_NAME || 'ngo_kiosk']);
      
      const columnNames = columns.map(col => col.COLUMN_NAME);
      
      if (!columnNames.includes('prize')) {
        console.log('🔄 Adding prize column to raffle_winners table...');
        await connection.execute(`ALTER TABLE raffle_winners ADD COLUMN prize VARCHAR(255)`);
        console.log('✅ Prize column added to raffle_winners table');
      }
    } catch (error) {
      console.log('Raffle winners table migration error:', error.message);
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
