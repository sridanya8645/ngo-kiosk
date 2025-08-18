require('dotenv').config();
const { pool } = require('./db');

// Utility data for generating dummy users
const firstNames = [
  'John','Jane','Michael','Sarah','David','Emily','James','Jessica','Robert','Amanda',
  'William','Ashley','Richard','Stephanie','Joseph','Nicole','Thomas','Elizabeth','Christopher','Helen',
  'Charles','Deborah','Daniel','Rachel','Matthew','Carolyn','Anthony','Janet','Mark','Catherine',
  'Donald','Maria','Steven','Heather','Paul','Diane','Andrew','Ruth','Joshua','Julie',
  'Kenneth','Joyce','Kevin','Virginia','Brian','Victoria','George','Kelly','Edward','Lauren',
  'Ronald','Christine','Timothy','Joan','Jason','Evelyn','Jeffrey','Judith','Ryan','Megan',
  'Jacob','Cheryl','Gary','Andrea','Nicholas','Hannah','Eric','Jacqueline','Jonathan','Martha',
  'Stephen','Gloria','Larry','Teresa','Justin','Ann','Scott','Sara','Brandon','Madison',
  'Benjamin','Frances','Samuel','Kathryn','Frank','Janice','Gregory','Jean','Raymond','Abigail',
  'Alexander','Alice','Patrick','Julia','Jack','Judy','Dennis','Sophia','Jerry','Grace'
];

const lastNames = [
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez',
  'Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin',
  'Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson',
  'Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores',
  'Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts',
  'Gomez','Phillips','Evans','Turner','Diaz','Parker','Cruz','Edwards','Collins','Reyes',
  'Stewart','Morris','Morales','Murphy','Cook','Rogers','Gutierrez','Ortiz','Morgan','Cooper',
  'Peterson','Bailey','Reed','Kelly','Howard','Ramos','Kim','Cox','Ward','Richardson',
  'Watson','Brooks','Chavez','Wood','James','Bennett','Gray','Mendoza','Ruiz','Hughes',
  'Price','Alvarez','Castillo','Sanders','Patel','Myers','Long','Ross','Foster','Jimenez'
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhone() {
  const a = randomInt(100, 999);
  const b = randomInt(100, 999);
  const c = randomInt(1000, 9999);
  return `${a}-${b}-${c}`;
}

function generateEmail(first, last) {
  const domains = ['gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com'];
  const domain = domains[randomInt(0, domains.length - 1)];
  const variants = [
    `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`,
    `${first.toLowerCase()}${last.toLowerCase()}@${domain}`,
    `${first.toLowerCase()}_${last.toLowerCase()}@${domain}`,
    `${last.toLowerCase()}.${first.toLowerCase()}@${domain}`,
    `${first.toLowerCase()}${randomInt(1,999)}@${domain}`
  ];
  return variants[randomInt(0, variants.length - 1)];
}

async function seedCheckedInForTop3Events() {
  const connection = await pool.getConnection();
  try {
    console.log('Fetching up to 3 events from events table...');
    const [events] = await connection.execute(
      'SELECT id, name, date FROM events ORDER BY date ASC, id ASC LIMIT 3'
    );

    if (!events.length) {
      console.log('No events found. Aborting.');
      return;
    }

    let totalInserted = 0;

    for (const ev of events) {
      const count = randomInt(30, 50);
      console.log(`Generating ${count} checked-in registrations for event: ${ev.name} (${ev.id}) on ${ev.date}`);

      const inserts = [];
      for (let i = 0; i < count; i++) {
        const first = firstNames[randomInt(0, firstNames.length - 1)];
        const last = lastNames[randomInt(0, lastNames.length - 1)];
        const name = `${first} ${last}`;
        const phone = generatePhone();
        const email = generateEmail(first, last);
        const volunteer = randomInt(0, 1); // 0/1 boolean

        inserts.push(connection.execute(
          'INSERT INTO registrations (name, phone, email, event_id, event_name, event_date, interested_to_volunteer, checked_in, checkin_date) VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())',
          [name, phone, email, ev.id, ev.name, ev.date, volunteer]
        ));
      }

      const results = await Promise.all(inserts);
      totalInserted += results.length;
      console.log(`Inserted ${results.length} rows for event ${ev.id}`);
    }

    console.log(`Done. Inserted ${totalInserted} checked-in registrations across ${events.length} event(s).`);
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    connection.release();
  }
}

seedCheckedInForTop3Events().catch(err => {
  console.error(err);
  process.exit(1);
}); 