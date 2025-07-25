const db = require('./db');
db.run('DELETE FROM registrations WHERE event_id IS NULL', function(err) {
  if (err) console.error(err);
  else console.log('Deleted registrations with null event_id');
  process.exit();
}); 