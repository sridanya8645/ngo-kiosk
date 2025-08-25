require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function checkTotpStatus() {
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

    // Check TOTP status for Indoamericanexpo@gmail.com
    const [rows] = await connection.execute(`
      SELECT id, username, admin_id, totp_secret, is_active, created_at
      FROM users 
      WHERE username = 'Indoamericanexpo@gmail.com'
    `);

    if (rows.length > 0) {
      const user = rows[0];
      console.log('📊 User Details:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Admin ID: ${user.admin_id}`);
      console.log(`   TOTP Secret: ${user.totp_secret ? '✅ SET' : '❌ NOT SET'}`);
      console.log(`   Active: ${user.is_active}`);
      console.log(`   Created: ${user.created_at}`);
      
      if (user.totp_secret) {
        console.log('\n✅ User has TOTP set up - should only ask for 6-digit code');
      } else {
        console.log('\n❌ User does NOT have TOTP set up - will show manual secret for first-time setup');
      }
    } else {
      console.log('❌ User not found');
    }

    connection.end();
  } catch (error) {
    console.error('❌ Error checking TOTP status:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the check
checkTotpStatus();
