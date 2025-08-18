const mysql = require('mysql2/promise');

async function setupDatabase() {
  try {
    console.log('🔧 Setting up Azure MySQL Database...');

    // First connect without database to create it
    const connection = await mysql.createConnection({
      host: 'ngo-kiosk-mysql.mysql.database.azure.com',
      user: 'ngo_admin',
      password: 'MyApp2024!',
      port: 3306,
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    await connection.execute('CREATE DATABASE IF NOT EXISTS ngo_kiosk');
    console.log('✅ Database ngo_kiosk created/verified');

    await connection.end(); // Close the initial connection

    // Now connect directly to the ngo_kiosk database
    const dbConnection = await mysql.createConnection({
      host: 'ngo-kiosk-mysql.mysql.database.azure.com',
      user: 'ngo_admin',
      password: 'MyApp2024!',
      database: 'ngo_kiosk', // Connect directly to the database
      port: 3306,
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log('✅ Connected to ngo_kiosk database');

    // Create tables
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      )
    `);
    console.log('✅ Users table created');

    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        location VARCHAR(255) NOT NULL,
        banner VARCHAR(500)
      )
    `);
    console.log('✅ Events table created');

    await dbConnection.execute(`
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
    console.log('✅ Registrations table created');

    await dbConnection.execute(`
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
    console.log('✅ Raffle winners table created');

    // Insert default admin user
    await dbConnection.execute(`
      INSERT IGNORE INTO users (username, password)
      VALUES ('admin', 'admin123')
    `);
    console.log('✅ Admin user created');

    // Insert sample events
    await dbConnection.execute(`
      INSERT IGNORE INTO events (name, date, time, location, banner) VALUES
      ('Diwali Celebration', '2024-11-12', '18:00:00', 'Community Center', 'diwali-banner.jpg'),
      ('Christmas Party', '2024-12-25', '19:00:00', 'Town Hall', 'christmas-banner.jpg'),
      ('New Year Event', '2025-01-01', '20:00:00', 'City Park', 'newyear-banner.jpg')
    `);
    console.log('✅ Sample events created');

    await dbConnection.end();
    console.log('🎉 Database setup completed successfully!');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure Azure MySQL Database is created');
    console.log('   2. Add your IP to firewall rules in Azure Portal');
    console.log('   3. Check username and password');
  }
}

setupDatabase(); 