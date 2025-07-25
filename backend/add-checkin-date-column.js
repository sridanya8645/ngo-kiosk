const db = require('./db');

db.run('ALTER TABLE registrations ADD COLUMN checkin_date TEXT', function(err) {
  if (err) {
    console.error('Error adding checkin_date column:', err);
  } else {
    console.log('Successfully added checkin_date column to registrations table');
  }
  db.close();
}); 