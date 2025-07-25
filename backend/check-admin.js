const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./users.db');

console.log('Checking admin user in database...');

// Check if admin user exists
db.get("SELECT * FROM users WHERE username = ?", ["admin"], (err, row) => {
  if (err) {
    console.error('Error checking admin user:', err);
  } else if (row) {
    console.log('✅ Admin user found:');
    console.log('Username:', row.username);
    console.log('Password:', row.password);
  } else {
    console.log('❌ Admin user not found, creating...');
    db.run("INSERT INTO users (username, password) VALUES (?, ?)", ["admin", "password123"], function(err) {
      if (err) {
        console.error('Error creating admin user:', err);
      } else {
        console.log('✅ Admin user created successfully');
      }
      db.close();
    });
  }
});

// Test login with admin credentials
setTimeout(() => {
  db.get("SELECT * FROM users WHERE username = ? AND password = ?", ["admin", "password123"], (err, row) => {
    if (err) {
      console.error('Error testing login:', err);
    } else if (row) {
      console.log('✅ Login test successful - admin credentials work');
    } else {
      console.log('❌ Login test failed - admin credentials do not work');
    }
    db.close();
  });
}, 1000); 