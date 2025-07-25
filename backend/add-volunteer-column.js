// backend/add-volunteer-column.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(__dirname + '/users.db');

db.run('ALTER TABLE registrations ADD COLUMN interested_to_volunteer TEXT', function(err) {
  if (err) console.error(err);
  else console.log('Added interested_to_volunteer column');
  db.close();
}); 