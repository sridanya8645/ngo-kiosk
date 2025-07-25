const db = require('./db');

const today = new Date().toISOString().split('T')[0];
console.log(`Checking registrations for date: ${today}`);

db.get('SELECT COUNT(*) as count FROM registrations WHERE checked_in = 1 AND checkin_date = ?', [today], (err, row) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log(`Found ${row.count} registrations with today's check-in date`);
  }
  
  // Also check total registrations
  db.get('SELECT COUNT(*) as total FROM registrations', [], (err, totalRow) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log(`Total registrations in database: ${totalRow.total}`);
    }
    process.exit(0);
  });
}); 