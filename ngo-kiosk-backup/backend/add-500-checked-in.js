require('dotenv').config();
const mysql = require('mysql2/promise');

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ngo_kiosk',
  port: process.env.DB_PORT || 3306
};

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

async function addCheckedInRegistrations() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Starting to insert 500 checked-in registrations...');
    console.log(`Today's date: ${today}`);

    // First, ensure we have the newsletter event
    const [eventRows] = await connection.execute('SELECT id FROM events WHERE name = ?', ['Register for Newsletter and General Events']);
    
    let eventId;
    if (eventRows.length === 0) {
      // Create the newsletter event if it doesn't exist
      const [result] = await connection.execute('INSERT INTO events (name, date, time, location) VALUES (?, ?, ?, ?)', 
        ['Register for Newsletter and General Events', '2024-12-15', 'All Day', 'Shirdi Sai Dham Inc, 12 Perrine Road, Monmouth Junction NJ 08852']);
      eventId = result.insertId;
      console.log('Created newsletter event with ID:', eventId);
    } else {
      eventId = eventRows[0].id;
      console.log('Using existing newsletter event with ID:', eventId);
    }

    let completed = 0;
    const total = 500;
    
    for (let i = 0; i < total; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      const phone = generatePhoneNumber();
      const email = generateEmail(firstName, lastName);
      const volunteer = Math.random() > 0.7 ? 'Yes' : 'No'; // 30% chance of being interested in volunteering
      
      await connection.execute(
        'INSERT INTO registrations (name, phone, email, event_id, event_name, event_date, interested_to_volunteer, checked_in, checkin_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, phone, email, eventId, 'Register for Newsletter and General Events', '2024-12-15', volunteer, 1, today]
      );
      
      completed++;
      if (completed % 100 === 0) {
        console.log(`Inserted ${completed}/${total} checked-in registrations...`);
      }
    }
    
    console.log(`✅ Successfully inserted ${completed} checked-in registrations!`);
    console.log(`All registrations have checked_in = 1 and checkin_date = ${today}`);
    
    // Verify the data
    const [verifyRows] = await connection.execute('SELECT COUNT(*) as count FROM registrations WHERE checked_in = 1 AND checkin_date = ?', [today]);
    console.log(`Verified: ${verifyRows[0].count} registrations with today's check-in date`);
    
  } catch (error) {
    console.error('Error inserting checked-in registrations:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addCheckedInRegistrations().catch(console.error); 