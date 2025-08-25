require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function updateEventSchema() {
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

    // First, let's see the current events table structure
    const [currentStructure] = await connection.execute('DESCRIBE events');
    console.log('📊 Current events table structure:');
    currentStructure.forEach(col => {
      console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Add new combined datetime columns
    try {
      await connection.execute(`
        ALTER TABLE events ADD COLUMN start_datetime DATETIME
      `);
      console.log('✅ Added start_datetime column');
    } catch (error) {
      console.log('ℹ️ start_datetime column already exists');
    }

    try {
      await connection.execute(`
        ALTER TABLE events ADD COLUMN end_datetime DATETIME
      `);
      console.log('✅ Added end_datetime column');
    } catch (error) {
      console.log('ℹ️ end_datetime column already exists');
    }

    // Add audit trail columns
    try {
      await connection.execute(`
        ALTER TABLE events ADD COLUMN created_by INT
      `);
      console.log('✅ Added created_by column');
    } catch (error) {
      console.log('ℹ️ created_by column already exists');
    }

    try {
      await connection.execute(`
        ALTER TABLE events ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✅ Added created_at column');
    } catch (error) {
      console.log('ℹ️ created_at column already exists');
    }

    try {
      await connection.execute(`
        ALTER TABLE events ADD COLUMN modified_by INT
      `);
      console.log('✅ Added modified_by column');
    } catch (error) {
      console.log('ℹ️ modified_by column already exists');
    }

    try {
      await connection.execute(`
        ALTER TABLE events ADD COLUMN modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      `);
      console.log('✅ Added modified_at column');
    } catch (error) {
      console.log('ℹ️ modified_at column already exists');
    }

    // Update existing events to populate the new datetime columns
    const [existingEvents] = await connection.execute('SELECT id, date, time, end_date, end_time FROM events');
    
    for (const event of existingEvents) {
      if (event.date && event.time) {
        // Convert date and time to proper MySQL DATETIME format
        const dateStr = event.date.toISOString().split('T')[0]; // Get YYYY-MM-DD
        const timeStr = event.time.toString(); // Get HH:MM:SS
        
        const startDateTime = `${dateStr} ${timeStr}`;
        await connection.execute(
          'UPDATE events SET start_datetime = ? WHERE id = ?',
          [startDateTime, event.id]
        );
        console.log(`✅ Updated event ${event.id} start_datetime: ${startDateTime}`);
      }
      
      if (event.end_date && event.end_time) {
        // Convert end date and time to proper MySQL DATETIME format
        const endDateStr = event.end_date.toISOString().split('T')[0]; // Get YYYY-MM-DD
        const endTimeStr = event.end_time.toString(); // Get HH:MM:SS
        
        const endDateTime = `${endDateStr} ${endTimeStr}`;
        await connection.execute(
          'UPDATE events SET end_datetime = ? WHERE id = ?',
          [endDateTime, event.id]
        );
        console.log(`✅ Updated event ${event.id} end_datetime: ${endDateTime}`);
      }
    }

    // Update created_at for existing events
    await connection.execute(`
      UPDATE events SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL
    `);
    console.log('✅ Updated existing events with created_at timestamp');

    // Show final structure
    const [finalStructure] = await connection.execute('DESCRIBE events');
    console.log('\n📊 Final events table structure:');
    finalStructure.forEach(col => {
      console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Show sample data
    const [sampleData] = await connection.execute(`
      SELECT id, name, start_datetime, end_datetime, location, raffle_tickets, 
             created_at, modified_at
      FROM events 
      LIMIT 3
    `);
    
    console.log('\n📊 Sample event data:');
    sampleData.forEach(event => {
      console.log(`   Event ID: ${event.id}`);
      console.log(`   Name: ${event.name}`);
      console.log(`   Start: ${event.start_datetime}`);
      console.log(`   End: ${event.end_datetime}`);
      console.log(`   Location: ${event.location}`);
      console.log(`   Raffle Tickets: ${event.raffle_tickets}`);
      console.log(`   Created: ${event.created_at}`);
      console.log(`   Modified: ${event.modified_at}`);
      console.log('   ---');
    });

    connection.end();
    console.log('\n🎉 Events table schema updated successfully!');
  } catch (error) {
    console.error('❌ Error updating events schema:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the update
updateEventSchema();
