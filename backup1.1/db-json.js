const fs = require('fs');
const path = require('path');

// Database file paths
const dbDir = path.join(__dirname, 'data');
const usersFile = path.join(dbDir, 'users.json');
const eventsFile = path.join(dbDir, 'events.json');
const registrationsFile = path.join(dbDir, 'registrations.json');
const raffleWinnersFile = path.join(dbDir, 'raffle-winners.json');

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database files if they don't exist
function initializeDatabase() {
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([
      { id: 1, username: 'admin', password: 'admin123' }
    ]));
  }
  
  if (!fs.existsSync(eventsFile)) {
    fs.writeFileSync(eventsFile, JSON.stringify([
      {
        id: 1,
        name: 'Community Service Day',
        date: '2024-12-15',
        time: '10:00 AM',
        description: 'Join us for a day of community service and giving back.',
        max_participants: 100,
        current_participants: 0
      }
    ]));
  }
  
  if (!fs.existsSync(registrationsFile)) {
    fs.writeFileSync(registrationsFile, JSON.stringify([]));
  }
  
  if (!fs.existsSync(raffleWinnersFile)) {
    fs.writeFileSync(raffleWinnersFile, JSON.stringify([]));
  }
}

// Read data from file
function readData(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

// Write data to file
function writeData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

// Database operations
const db = {
  // Initialize database
  init: function() {
    initializeDatabase();
  },

  // Get single record
  get: function(query, params, callback) {
    // Parse the query to determine which table and operation
    if (query.includes('users WHERE username')) {
      const users = readData(usersFile);
      const user = users.find(u => u.username === params[0] && u.password === params[1]);
      callback(null, user || null);
    } else if (query.includes('events WHERE id')) {
      const events = readData(eventsFile);
      const event = events.find(e => e.id === params[0]);
      callback(null, event || null);
    } else if (query.includes('registrations WHERE id')) {
      const registrations = readData(registrationsFile);
      const registration = registrations.find(r => r.id === params[0]);
      callback(null, registration || null);
    } else {
      callback(new Error('Query not supported'));
    }
  },

  // Get all records
  all: function(query, params, callback) {
    if (query.includes('events')) {
      const events = readData(eventsFile);
      callback(null, events);
    } else if (query.includes('registrations')) {
      const registrations = readData(registrationsFile);
      callback(null, registrations);
    } else if (query.includes('raffle_winners')) {
      const winners = readData(raffleWinnersFile);
      callback(null, winners);
    } else {
      callback(new Error('Query not supported'));
    }
  },

  // Insert record
  run: function(query, params, callback) {
    if (query.includes('INSERT INTO registrations')) {
      const registrations = readData(registrationsFile);
      const newId = registrations.length > 0 ? Math.max(...registrations.map(r => r.id)) + 1 : 1;
      const newRegistration = {
        id: newId,
        name: params[0],
        phone: params[1],
        email: params[2],
        event_id: params[3],
        event_name: params[4],
        event_date: params[5],
        interested_to_volunteer: params[6],
        checkin_date: null,
        checkin_time: null,
        created_at: new Date().toISOString()
      };
      registrations.push(newRegistration);
      writeData(registrationsFile, registrations);
      
      // Update event participants count
      const events = readData(eventsFile);
      const eventIndex = events.findIndex(e => e.id === params[3]);
      if (eventIndex !== -1) {
        events[eventIndex].current_participants += 1;
        writeData(eventsFile, events);
      }
      
      callback(null, { lastID: newId });
    } else if (query.includes('INSERT INTO raffle_winners')) {
      const winners = readData(raffleWinnersFile);
      const newId = winners.length > 0 ? Math.max(...winners.map(w => w.id)) + 1 : 1;
      const newWinner = {
        id: newId,
        registration_id: params[0],
        name: params[1],
        event_id: params[2],
        event_name: params[3],
        win_date_time: new Date().toISOString()
      };
      winners.push(newWinner);
      writeData(raffleWinnersFile, winners);
      callback(null, { lastID: newId });
    } else {
      callback(new Error('Query not supported'));
    }
  },

  // Update record
  update: function(query, params, callback) {
    if (query.includes('UPDATE registrations SET checkin_date')) {
      const registrations = readData(registrationsFile);
      const regIndex = registrations.findIndex(r => r.id === params[0]);
      if (regIndex !== -1) {
        registrations[regIndex].checkin_date = params[1];
        registrations[regIndex].checkin_time = params[2];
        writeData(registrationsFile, registrations);
        callback(null, { changes: 1 });
      } else {
        callback(null, { changes: 0 });
      }
    } else {
      callback(new Error('Query not supported'));
    }
  },

  // Delete records
  delete: function(query, params, callback) {
    if (query.includes('DELETE FROM registrations')) {
      writeData(registrationsFile, []);
      callback(null, { changes: 1 });
    } else {
      callback(new Error('Query not supported'));
    }
  }
};

// Initialize database on module load
db.init();

module.exports = db; 