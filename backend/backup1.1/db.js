require('dotenv').config();

// In-memory database for Azure free tier
let users = [
  { id: 1, username: 'admin', password: 'password123' },
  { id: 2, username: 'user', password: 'passw0rd123' }
];

let events = [
  { 
    id: 1, 
    name: 'Register for Newsletter and General Events', 
    date: '2024-12-31', 
    time: 'All Day', 
    location: 'Temple', 
    banner: null 
  }
];

let registrations = [];

let raffleWinners = [];

// Initialize database (in-memory)
function initializeDatabase() {
  console.log('Initializing in-memory database...');
  // Database is already initialized with default data
}

// Database helper functions
function findUser(username) {
  return users.find(user => user.username === username);
}

function addEvent(event) {
  const newEvent = { ...event, id: events.length + 1 };
  events.push(newEvent);
  return newEvent;
}

function getEvents() {
  return events;
}

function getTodaysEvents() {
  const today = new Date().toISOString().split('T')[0];
  return events.filter(event => event.date === today);
}

function addRegistration(registration) {
  const newRegistration = { ...registration, id: registrations.length + 1 };
  registrations.push(newRegistration);
  return newRegistration;
}

function getRegistrations() {
  return registrations;
}

function updateRegistration(id, updates) {
  const index = registrations.findIndex(reg => reg.id === id);
  if (index !== -1) {
    registrations[index] = { ...registrations[index], ...updates };
    return registrations[index];
  }
  return null;
}

function addRaffleWinner(winner) {
  const newWinner = { ...winner, id: raffleWinners.length + 1 };
  raffleWinners.push(newWinner);
  return newWinner;
}

function getRaffleWinners() {
  return raffleWinners;
}

// Initialize database on module load
initializeDatabase();

module.exports = {
  findUser,
  addEvent,
  getEvents,
  getTodaysEvents,
  addRegistration,
  getRegistrations,
  updateRegistration,
  addRaffleWinner,
  getRaffleWinners
};
