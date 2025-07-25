const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(__dirname + '/users.db');
db.run('DROP TABLE IF EXISTS registrations_old', function(err) {
  if (err) console.error(err);
  else console.log('Dropped registrations_old table');
  db.close();
}); 