require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function fixUsersTable() {
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

    // Add missing columns to users table
    try {
      await connection.execute(`
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✅ Added created_at column to users table');
    } catch (error) {
      console.log('ℹ️ created_at column already exists');
    }

    try {
      await connection.execute(`
        ALTER TABLE users ADD COLUMN created_by INT
      `);
      console.log('✅ Added created_by column to users table');
    } catch (error) {
      console.log('ℹ️ created_by column already exists');
    }

    // Update existing users to have created_at timestamp
    await connection.execute(`
      UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL
    `);
    console.log('✅ Updated existing users with created_at timestamp');

    // Test the admin users query
    const [rows] = await connection.execute(`
      SELECT id, username, admin_id, created_at, is_active, 
             (SELECT username FROM users WHERE id = u.created_by) as created_by_name
      FROM users u 
      ORDER BY created_at DESC
    `);

    console.log('✅ Admin users query successful!');
    console.log(`📊 Found ${rows.length} admin users:`);
    
    rows.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, Username: ${user.username}, Admin ID: ${user.admin_id}, Active: ${user.is_active}, Created: ${user.created_at}`);
    });

    connection.end();
    console.log('🎉 Users table fixed successfully!');
  } catch (error) {
    console.error('❌ Error fixing users table:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the fix
fixUsersTable();
