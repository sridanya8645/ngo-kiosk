require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function testAdminUsers() {
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

    // Test the exact same query as the API
    const [rows] = await connection.execute(`
      SELECT id, username, admin_id, created_at, is_active, 
             (SELECT username FROM users WHERE id = u.created_by) as created_by_name
      FROM users u 
      ORDER BY created_at DESC
    `);

    console.log('✅ Admin users query successful!');
    console.log(`📊 Found ${rows.length} admin users:`);
    
    rows.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, Username: ${user.username}, Admin ID: ${user.admin_id}, Active: ${user.is_active}`);
    });

    // Test if we can create a new admin user
    console.log('\n🧪 Testing admin user creation...');
    
    const testUsername = 'testadmin@example.com';
    const testPassword = 'testpass123';
    
    // Check if test user exists
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE username = ?',
      [testUsername]
    );

    if (existing.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(testPassword, 12);
      
      await connection.execute(`
        INSERT INTO users (username, password, admin_id, is_active) 
        VALUES (?, ?, 'TEST001', 1)
      `, [testUsername, hashedPassword]);
      
      console.log('✅ Test admin user created successfully!');
      console.log(`📧 Test Username: ${testUsername}`);
      console.log(`🔑 Test Password: ${testPassword}`);
    } else {
      console.log('⚠️ Test admin user already exists');
    }

    connection.end();
  } catch (error) {
    console.error('❌ Error testing admin users:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the test
testAdminUsers();
