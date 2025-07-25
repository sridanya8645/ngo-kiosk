const db = require('./db');
db.run('ALTER TABLE registrations ADD COLUMN checked_in INTEGER DEFAULT 0', function(err) {
  if (err) console.error(err);
  else console.log('Added checked_in column');
  process.exit();
});
