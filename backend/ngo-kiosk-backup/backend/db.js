require('dotenv').config();
const mysql = require('mysql2/promise');

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ngo_kiosk',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Initialize database and create tables
async function initializeDatabase() {
  try {
    // First, connect without specifying database to create it
    const tempConfig = { ...dbConfig };
    delete tempConfig.database;
    const tempConnection = await mysql.createConnection(tempConfig);
    
    // Create database if it doesn't exist
    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'ngo_kiosk'}`);
    await tempConnection.end();
    
    // Now connect to the specific database
    const connection = await pool.getConnection();
    
    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE,
        password VARCHAR(255)
      )
    `);

    // Create events table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        date VARCHAR(255) NOT NULL,
        time VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        banner VARCHAR(255)
      )
    `);

    // Create registrations table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        phone VARCHAR(255),
        email VARCHAR(255),
        event_id INT,
        checked_in INT DEFAULT 0,
        checkin_date VARCHAR(255),
        event_name VARCHAR(255),
        event_date VARCHAR(255),
        registered_at VARCHAR(255),
        interested_to_volunteer VARCHAR(255),
        FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE SET NULL
      )
    `);

    // Create raffle_winners table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS raffle_winners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        registration_id INT,
        name VARCHAR(255),
        email VARCHAR(255),
        event_name VARCHAR(255),
        win_date VARCHAR(255),
        win_time VARCHAR(255),
        phone VARCHAR(255),
        won_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(registration_id) REFERENCES registrations(id) ON DELETE SET NULL
      )
    `);

    // Insert admin user if not exists
    const [adminUsers] = await connection.execute("SELECT * FROM users WHERE username = ?", ["admin"]);
    if (adminUsers.length === 0) {
      await connection.execute("INSERT INTO users (username, password) VALUES (?, ?)", ["admin", "password123"]);
    }

    // Insert user if not exists
    const [users] = await connection.execute("SELECT * FROM users WHERE username = ?", ["user"]);
    if (users.length === 0) {
      await connection.execute("INSERT INTO users (username, password) VALUES (?, ?)", ["user", "passw0rd123"]);
    }

    // Insert sample events if they don't exist
    const [eventCount] = await connection.execute("SELECT COUNT(*) as count FROM events");
    if (eventCount[0].count === 0) {
      await connection.execute(`
        INSERT INTO events (name, date, time, location) VALUES 
        ('Register for Newsletter and General Events', '2024-12-15', '10:00 AM', 'Non-Governmental Organization'),
        ('Community Service Day', '2024-12-20', '9:00 AM', 'Non-Governmental Organization'),
        ('Charity Fundraiser', '2024-12-25', '2:00 PM', 'Non-Governmental Organization')
      `);
    }

    connection.release();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Initialize database on module load
initializeDatabase().catch(console.error);

module.exports = pool;
