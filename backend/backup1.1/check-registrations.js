const db = require('./db.js');

async function checkRegistrations() {
  try {
    const [registrations] = await db.execute('SELECT * FROM registrations LIMIT 5');
    console.log('Registrations in database:');
    console.log(JSON.stringify(registrations, null, 2));
  } catch (error) {
    console.error('Error checking registrations:', error);
  } finally {
    process.exit(0);
  }
}

checkRegistrations(); 