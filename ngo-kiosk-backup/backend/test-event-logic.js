const db = require('./db');

async function testEventLogic() {
  try {
    const connection = await db.getConnection();
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Get next week's date
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    
    console.log('Testing event logic with dates:');
    console.log('Today:', today);
    console.log('Tomorrow:', tomorrowStr);
    console.log('Next Week:', nextWeekStr);
    
    // Clear existing test events
    await connection.execute("DELETE FROM events WHERE name LIKE 'Test Event%'");
    
    // Add a future event (next week)
    await connection.execute(
      "INSERT INTO events (name, date, time, location) VALUES (?, ?, ?, ?)",
      ["Test Event - Future", nextWeekStr, "2:00 PM", "Test Location"]
    );
    
    // Test 1: Should return future event when no today's event
    console.log('\n--- Test 1: No today\'s event, should show future event ---');
    const [futureEvent] = await connection.execute(`SELECT * FROM events WHERE date = CURDATE() ORDER BY time ASC`);
    if (futureEvent.length === 0) {
      const [nextEvent] = await connection.execute(`
        SELECT * FROM events 
        WHERE date > CURDATE() 
        ORDER BY date ASC, time ASC 
        LIMIT 1
      `);
      console.log('Future event found:', nextEvent[0]);
    }
    
    // Add today's event
    await connection.execute(
      "INSERT INTO events (name, date, time, location) VALUES (?, ?, ?, ?)",
      ["Test Event - Today", today, "10:00 AM", "Test Location Today"]
    );
    
    // Test 2: Should return today's event when it exists
    console.log('\n--- Test 2: Today\'s event exists, should show today\'s event ---');
    const [todayEvent] = await connection.execute(`SELECT * FROM events WHERE date = CURDATE() ORDER BY time ASC`);
    if (todayEvent.length > 0) {
      console.log('Today\'s event found:', todayEvent[0]);
    }
    
    // Test the actual API logic
    console.log('\n--- Testing actual API logic ---');
    const [todayRows] = await connection.execute(`SELECT * FROM events WHERE date = CURDATE() ORDER BY time ASC`);
    
    if (todayRows.length > 0) {
      console.log('API would return today\'s event:', todayRows[0]);
    } else {
      const [futureRows] = await connection.execute(`
        SELECT * FROM events 
        WHERE date > CURDATE() 
        ORDER BY date ASC, time ASC 
        LIMIT 1
      `);
      
      if (futureRows.length > 0) {
        console.log('API would return future event:', futureRows[0]);
      } else {
        console.log('API would return no events');
      }
    }
    
    // Clean up test events
    await connection.execute("DELETE FROM events WHERE name LIKE 'Test Event%'");
    
    console.log('\n--- Test completed ---');
    connection.release();
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testEventLogic(); 