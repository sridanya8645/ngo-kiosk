// Script to list all tables in users.db
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(__dirname + '/users.db');

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
  if (err) {
    console.error('Error listing tables:', err);
  } else {
    console.log('Tables in users.db:');
    rows.forEach(row => console.log(row.name));
  }
  db.close();
}); 