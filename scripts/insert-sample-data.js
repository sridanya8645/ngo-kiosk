const mysql = require('mysql2/promise');

// Database configuration - Use Azure database connection
const dbConfig = {
  host: 'ngo-kiosk-server.mysql.database.azure.com',
  user: 'ngo_admin@ngo-kiosk-server',
  password: 'Ngo@2025',
  database: 'ngo_kiosk',
  port: 3306,
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

async function insertSampleData() {
  let connection;
  
  try {
    console.log('🔍 Attempting to connect to Azure database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Get today's and yesterday's dates
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    console.log('📅 Today:', todayStr);
    console.log('📅 Yesterday:', yesterdayStr);

    // Get the first event from the database
    const [events] = await connection.execute('SELECT id FROM events LIMIT 1');
    if (events.length === 0) {
      console.log('❌ No events found. Please create an event first.');
      return;
    }
    const eventId = events[0].id;
    console.log('✅ Using event ID:', eventId);

    // Generate sample data
    const sampleData = [];
    
    // 3000 records for today (checked in)
    for (let i = 1; i <= 3000; i++) {
      sampleData.push({
        name: `Sample User ${i}`,
        email: `user${i}@example.com`,
        phone: `555-${String(i).padStart(4, '0')}`,
        event_id: eventId,
        event_name: 'Sample Event',
        event_date: todayStr,
        checked_in: 1,
        checkin_date: todayStr,
        interested_to_volunteer: Math.random() > 0.5 ? 'Yes' : 'No',
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });
    }
    
    // 1000 records for yesterday (checked in)
    for (let i = 3001; i <= 4000; i++) {
      sampleData.push({
        name: `Sample User ${i}`,
        email: `user${i}@example.com`,
        phone: `555-${String(i).padStart(4, '0')}`,
        event_id: eventId,
        event_name: 'Sample Event',
        event_date: yesterdayStr,
        checked_in: 1,
        checkin_date: yesterdayStr,
        interested_to_volunteer: Math.random() > 0.5 ? 'Yes' : 'No',
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });
    }

    console.log(`📊 Generated ${sampleData.length} sample records`);
    console.log(`   - ${3000} records for today (${todayStr})`);
    console.log(`   - ${1000} records for yesterday (${yesterdayStr})`);

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
        record.created_at
      ]);
      
      const sql = `INSERT INTO registrations (name, email, phone, event_id, event_name, event_date, checked_in, checkin_date, interested_to_volunteer, created_at) VALUES ?`;
      await connection.execute(sql, [values]);
      insertedCount += batch.length;
      
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(sampleData.length/batchSize)} (${insertedCount}/${sampleData.length} records)`);
    }
    
    console.log(`🎉 Successfully inserted ${insertedCount} sample records!`);
    console.log(`📈 Database now has ${insertedCount} additional registrations for testing`);
    
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
    if (error.code === 'ENOTFOUND') {
      console.error('💡 This script needs to be run from the Azure environment where the database is accessible');
      console.error('💡 You can run this script from the Azure App Service console or SSH session');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

insertSampleData();
