const db = require('./db');

// Add win_date and win_time columns to raffle_winners table
db.run(`ALTER TABLE raffle_winners ADD COLUMN win_date TEXT`, (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding win_date column:', err);
  } else {
    console.log('win_date column added successfully or already exists');
  }
  
  db.run(`ALTER TABLE raffle_winners ADD COLUMN win_time TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding win_time column:', err);
    } else {
      console.log('win_time column added successfully or already exists');
    }
    
    // Update existing records to have win_date and win_time
    db.run(`UPDATE raffle_winners SET win_date = date(won_at), win_time = time(won_at) WHERE win_date IS NULL`, (err) => {
      if (err) {
        console.error('Error updating existing records:', err);
      } else {
        console.log('Existing records updated with win_date and win_time');
      }
      process.exit(0);
    });
  });
}); 