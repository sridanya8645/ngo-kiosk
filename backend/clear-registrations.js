const db = require('./db');

console.log('Clearing all registrations...');

db.run('DELETE FROM registrations', function(err) {
  if (err) {
    console.error('Error clearing registrations:', err);
  } else {
    console.log('Successfully cleared all registrations from the table');
    console.log('Rows deleted:', this.changes);
  }
  db.close();
}); 