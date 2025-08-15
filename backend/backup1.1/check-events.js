const db = require('./db.js');

async function checkEvents() {
  try {
    const [events] = await db.execute('SELECT * FROM events');
    console.log('Events in database:');
    console.log(JSON.stringify(events, null, 2));
  } catch (error) {
    console.error('Error checking events:', error);
  } finally {
    process.exit(0);
  }
}

checkEvents(); 