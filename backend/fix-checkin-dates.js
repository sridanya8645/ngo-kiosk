const db = require('./db');

console.log('Fixing checkin dates for existing checked-in records...');

const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

// Update all records that are checked_in = 1 but have no checkin_date
db.run('UPDATE registrations SET checkin_date = ? WHERE checked_in = 1 AND (checkin_date IS NULL OR checkin_date = "")', [today], function(err) {
  if (err) {
    console.error('Error updating checkin dates:', err);
  } else {
    console.log('Successfully updated checkin dates for', this.changes, 'records');
    
    // Show the updated records
    db.all('SELECT id, name, checked_in, checkin_date FROM registrations WHERE checked_in = 1', [], (err, rows) => {
      if (err) {
        console.error('Error fetching updated records:', err);
      } else {
        console.log('Updated records:');
        rows.forEach(row => {
          console.log(`ID: ${row.id}, Name: ${row.name}, Checked In: ${row.checked_in}, Checkin Date: ${row.checkin_date}`);
        });
      }
      db.close();
    });
  }
}); 