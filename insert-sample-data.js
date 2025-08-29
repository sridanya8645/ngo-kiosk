const mysql = require('mysql2/promise');

// Database configuration - Use Azure database connection
const dbConfig = {
  host: process.env.DB_HOST || 'ngo-kiosk-server.mysql.database.azure.com',
  user: process.env.DB_USER || 'ngo_admin@ngo-kiosk-server',
  password: process.env.DB_PASSWORD || 'Ngo@2025',
  database: process.env.DB_NAME || 'ngo_kiosk',
  port: process.env.DB_PORT || 3306,
  ssl: {
    rejectUnauthorized: false
  }
};

async function insertSampleData() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Get today's and yesterday's dates
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    console.log(`📅 Today: ${todayStr}, Yesterday: ${yesterdayStr}`);

    // Get the first event ID
    const [events] = await connection.execute('SELECT id FROM events LIMIT 1');
    if (events.length === 0) {
      console.log('❌ No events found. Please create an event first.');
      return;
    }
    
    const eventId = events[0].id;
    console.log(`🎯 Using event ID: ${eventId}`);

    // Generate sample data
    const sampleData = [];
    
    // Generate 3000 records for today (checked in)
    for (let i = 1; i <= 3000; i++) {
      const name = `Sample User ${i}`;
      const email = `user${i}@example.com`;
      const phone = `555${String(i).padStart(7, '0')}`;
      
      sampleData.push({
        name,
        email,
        phone,
        event_id: eventId,
        event_name: 'Indo American Fair 2025',
        event_date: todayStr,
        checked_in: 1,
        checkin_date: `${todayStr} ${String(9 + (i % 10)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00`,
        interested_to_volunteer: i % 5 === 0 ? 'Yes' : 'No',
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    
    // Generate 1000 records for yesterday (checked in)
    for (let i = 3001; i <= 4000; i++) {
      const name = `Sample User ${i}`;
      const email = `user${i}@example.com`;
      const phone = `555${String(i).padStart(7, '0')}`;
      
      sampleData.push({
        name,
        email,
        phone,
        event_id: eventId,
        event_name: 'Indo American Fair 2025',
        event_date: yesterdayStr,
        checked_in: 1,
        checkin_date: `${yesterdayStr} ${String(9 + (i % 10)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00`,
        interested_to_volunteer: i % 5 === 0 ? 'Yes' : 'No',
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }

    console.log(`📊 Generated ${sampleData.length} sample records`);

    // Insert data in batches
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < sampleData.length; i += batchSize) {
      const batch = sampleData.slice(i, i + batchSize);
      
      const values = batch.map(record => [
        record.name,
        record.email,
        record.phone,
        record.event_id,
        record.event_name,
        record.event_date,
        record.checked_in,
        record.checkin_date,
        record.interested_to_volunteer,
        record.created_at,
      ]);
      
      const sql = `
        INSERT INTO registrations 
        (name, email, phone, event_id, event_name, event_date, checked_in, checkin_date, interested_to_volunteer, created_at)
        VALUES ?
      `;
      
      await connection.execute(sql, [values]);
      insertedCount += batch.length;
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${insertedCount}/${sampleData.length} records`);
    }

    console.log(`🎉 Successfully inserted ${insertedCount} sample records!`);
    console.log(`📈 Today's check-ins: 3000`);
    console.log(`📈 Yesterday's check-ins: 1000`);
    console.log(`📈 Total: 4000 records`);

  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
insertSampleData();
