require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function setupFirstAdmin() {
  try {
    // Database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'ngo-kiosk-mysql.mysql.database.azure.com',
      user: process.env.DB_USER || 'ngo_admin',
      password: process.env.DB_PASSWORD || 'MyApp2024!',
      database: process.env.DB_NAME || 'ngo_kiosk',
      port: process.env.DB_PORT || 3306,
      ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync(path.join(__dirname, 'DigiCertGlobalRootCA.crt.pem'))
      }
    });

    console.log('✅ Connected to database');

    // Ensure all required columns exist
    try {
      await connection.execute(`
        ALTER TABLE users ADD COLUMN admin_id VARCHAR(50) UNIQUE
      `);
      console.log('✅ Added admin_id column to users table');
    } catch (error) {
      console.log('ℹ️ admin_id column already exists');
    }

    try {
      await connection.execute(`
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE
      `);
      console.log('✅ Added is_active column to users table');
    } catch (error) {
      console.log('ℹ️ is_active column already exists');
    }

    try {
      await connection.execute(`
        ALTER TABLE users ADD COLUMN totp_secret VARCHAR(255)
      `);
      console.log('✅ Added totp_secret column to users table');
    } catch (error) {
      console.log('ℹ️ totp_secret column already exists');
    }

    // Check if admin user already exists
    const [existingUsers] = await connection.execute(
      "SELECT id FROM users WHERE username = ?",
      ['Indoamericanexpo@gmail.com']
    );

    if (existingUsers.length > 0) {
      console.log('⚠️ Admin user already exists: Indoamericanexpo@gmail.com');
      connection.end();
      return;
    }

    // Hash the admin password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    console.log('✅ Generated bcrypt hash for admin123');

    // Create the first admin user
    await connection.execute(`
      INSERT INTO users (username, password, admin_id, is_active) 
      VALUES (?, ?, 'ADMIN001', 1)
    `, ['Indoamericanexpo@gmail.com', hashedPassword]);

    console.log('✅ First admin user created successfully!');
    console.log('📧 Username: Indoamericanexpo@gmail.com');
    console.log('🔑 Password: admin123');
    console.log('🆔 Admin ID: ADMIN001');
    console.log('');
    console.log('🚀 You can now login to the admin interface!');

    connection.end();
  } catch (error) {
    console.error('❌ Error setting up first admin:', error);
    process.exit(1);
  }
}

// Run the setup
setupFirstAdmin();
