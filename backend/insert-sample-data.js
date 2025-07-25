const db = require('./db');

// Get today's date in YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0];

// Sample names for variety
const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Jessica', 'Robert', 'Amanda',
  'William', 'Ashley', 'Richard', 'Stephanie', 'Joseph', 'Nicole', 'Thomas', 'Elizabeth', 'Christopher', 'Helen',
  'Charles', 'Deborah', 'Daniel', 'Rachel', 'Matthew', 'Carolyn', 'Anthony', 'Janet', 'Mark', 'Catherine',
  'Donald', 'Maria', 'Steven', 'Heather', 'Paul', 'Diane', 'Andrew', 'Ruth', 'Joshua', 'Julie',
  'Kenneth', 'Joyce', 'Kevin', 'Virginia', 'Brian', 'Victoria', 'George', 'Kelly', 'Edward', 'Lauren',
  'Ronald', 'Christine', 'Timothy', 'Joan', 'Jason', 'Evelyn', 'Jeffrey', 'Judith', 'Ryan', 'Megan',
  'Jacob', 'Cheryl', 'Gary', 'Andrea', 'Nicholas', 'Hannah', 'Eric', 'Jacqueline', 'Jonathan', 'Martha',
  'Stephen', 'Gloria', 'Larry', 'Teresa', 'Justin', 'Ann', 'Scott', 'Sara', 'Brandon', 'Madison',
  'Benjamin', 'Frances', 'Samuel', 'Kathryn', 'Frank', 'Janice', 'Gregory', 'Jean', 'Raymond', 'Abigail',
  'Alexander', 'Alice', 'Patrick', 'Julia', 'Jack', 'Judy', 'Dennis', 'Sophia', 'Jerry', 'Grace'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
  'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
  'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez'
];

// Sample phone numbers
const generatePhoneNumber = () => {
  const areaCode = Math.floor(Math.random() * 900) + 100; // 100-999
  const prefix = Math.floor(Math.random() * 900) + 100; // 100-999
  const lineNumber = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
  return `${areaCode}-${prefix}-${lineNumber}`;
};

// Sample email domains
const emailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];

const generateEmail = (firstName, lastName) => {
  const domain = emailDomains[Math.floor(Math.random() * emailDomains.length)];
  const variations = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}${Math.floor(Math.random() * 999)}@${domain}`,
    `${lastName.toLowerCase()}.${firstName.toLowerCase()}@${domain}`
  ];
  return variations[Math.floor(Math.random() * variations.length)];
};

console.log('Starting to insert 1000 sample registrations...');
console.log(`Today's date: ${today}`);

// First, ensure we have the newsletter event
db.get('SELECT id FROM events WHERE name = ?', ['Register for Newsletter and General Events'], (err, event) => {
  if (err) {
    console.error('Error checking for event:', err);
    return;
  }
  
  if (!event) {
    // Create the newsletter event if it doesn't exist
    db.run('INSERT INTO events (name, date, time, location) VALUES (?, ?, ?, ?)', 
      ['Register for Newsletter and General Events', '2024-12-15', 'All Day', 'Shirdi Sai Dham Inc, 12 Perrine Road, Monmouth Junction NJ 08852'],
      function(err) {
        if (err) {
          console.error('Error creating event:', err);
          return;
        }
        console.log('Created newsletter event with ID:', this.lastID);
        insertSampleData(this.lastID);
      }
    );
  } else {
    console.log('Using existing newsletter event with ID:', event.id);
    insertSampleData(event.id);
  }
});

function insertSampleData(eventId) {
  let completed = 0;
  const total = 1000;
  
  for (let i = 0; i < total; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    const phone = generatePhoneNumber();
    const email = generateEmail(firstName, lastName);
    const volunteer = Math.random() > 0.7 ? 'Yes' : 'No'; // 30% chance of being interested in volunteering
    
    db.run(
      'INSERT INTO registrations (name, phone, email, event_id, event_name, event_date, interested_to_volunteer, checked_in, checkin_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, phone, email, eventId, 'Register for Newsletter and General Events', '2024-12-15', volunteer, 1, today],
      function(err) {
        if (err) {
          console.error('Error inserting registration:', err);
        }
        
        completed++;
        if (completed % 100 === 0) {
          console.log(`Inserted ${completed}/${total} registrations...`);
        }
        
        if (completed === total) {
          console.log('✅ Successfully inserted 1000 sample registrations!');
          console.log(`All registrations have checked_in = 1 and checkin_date = ${today}`);
          
          // Verify the data
          db.get('SELECT COUNT(*) as count FROM registrations WHERE checked_in = 1 AND checkin_date = ?', [today], (err, row) => {
            if (err) {
              console.error('Error verifying data:', err);
            } else {
              console.log(`Verified: ${row.count} registrations with today's check-in date`);
            }
            process.exit(0);
          });
        }
      }
    );
  }
} 