const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./users.db');

db.all("PRAGMA table_info(registrations)", (err, columns) => {
  if (err) {
    console.error('Error fetching schema:', err);
  } else {
    console.log('Registrations Table Schema:');
    console.table(columns);
  }

  db.all('SELECT * FROM registrations', (err, rows) => {
    if (err) {
      console.error('Error fetching registrations:', err);
    } else {
      console.log('Registrations Data:');
      console.table(rows);
    }
    db.close();
  });
});
