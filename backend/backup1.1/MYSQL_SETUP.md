# MySQL Migration Setup Guide

## Overview
This project has been migrated from SQLite to MySQL. Follow these steps to set up the MySQL database.

## Prerequisites
1. MySQL Server installed and running
2. Node.js and npm installed
3. Access to MySQL with root privileges or a dedicated user

## Database Setup

### 1. Create MySQL Database
```sql
CREATE DATABASE ngo_kiosk;
USE ngo_kiosk;
```

### 2. Create MySQL User (Optional but Recommended)
```sql
CREATE USER 'ngo_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON ngo_kiosk.* TO 'ngo_user'@'localhost';
FLUSH PRIVILEGES;
```

## Environment Configuration

Create a `.env` file in the backend directory with the following variables:

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PORT=3306
DB_PASSWORD=your_mysql_password_here
DB_NAME=ngo_kiosk

# Email Configuration (for nodemailer)
EMAIL_USER=sridanyaravi07@gmail.com
EMAIL_PASS=axkghxaldttnldla

# Server Configuration
PORT=5000
NODE_ENV=development
```

## Installation Steps

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Initialize Database
The database tables will be created automatically when you start the server for the first time.

### 3. Start the Server
```bash
npm start
```

## Database Schema

The following tables will be created automatically:

### Users Table
- `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `username` (VARCHAR(255), UNIQUE)
- `password` (VARCHAR(255))

### Events Table
- `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `name` (VARCHAR(255), NOT NULL)
- `date` (VARCHAR(255), NOT NULL)
- `time` (VARCHAR(255), NOT NULL)
- `location` (VARCHAR(255), NOT NULL)
- `banner` (VARCHAR(255))

### Registrations Table
- `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `name` (VARCHAR(255))
- `phone` (VARCHAR(255))
- `email` (VARCHAR(255))
- `event_id` (INT, FOREIGN KEY)
- `checked_in` (INT, DEFAULT 0)
- `checkin_date` (VARCHAR(255))
- `event_name` (VARCHAR(255))
- `event_date` (VARCHAR(255))
- `registered_at` (VARCHAR(255))
- `interested_to_volunteer` (VARCHAR(255))

### Raffle Winners Table
- `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `registration_id` (INT, FOREIGN KEY)
- `name` (VARCHAR(255))
- `email` (VARCHAR(255))
- `event_name` (VARCHAR(255))
- `win_date` (VARCHAR(255))
- `win_time` (VARCHAR(255))
- `phone` (VARCHAR(255))
- `won_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

## Migration Notes

### Key Changes from SQLite to MySQL:
1. **Data Types**: Changed from SQLite types to MySQL types
   - `INTEGER` → `INT`
   - `TEXT` → `VARCHAR(255)`
   - `AUTOINCREMENT` → `AUTO_INCREMENT`

2. **Foreign Keys**: Updated to use `ON DELETE SET NULL` instead of `CASCADE`

3. **Date Functions**: Updated SQL functions
   - `date('now', 'localtime')` → `CURDATE()`
   - `date(won_at)` → `DATE(won_at)`
   - `time(won_at)` → `TIME(won_at)`

4. **Connection Management**: Changed from callback-based to async/await pattern

## Troubleshooting

### Common Issues:

1. **Connection Refused**
   - Ensure MySQL server is running
   - Check if the port (3306) is correct
   - Verify firewall settings

2. **Access Denied**
   - Check MySQL user credentials
   - Ensure user has proper privileges
   - Verify database name exists

3. **Table Already Exists**
   - The application will handle this automatically
   - Tables are created with `IF NOT EXISTS`

### Testing Database Connection:
```bash
node check-admin.js
node check-data.js
node list_tables.js
```

## Sample Data

To populate the database with sample data:
```bash
node insert-sample-data.js      # 1000 registrations
node insert-500-sample-registrations.js  # 500 registrations for spin wheel
```

## API Endpoints

All existing API endpoints remain the same:
- `/api/login` - User authentication
- `/api/register` - Event registration
- `/api/events` - Event management
- `/api/registrations` - Registration management
- `/api/raffle-winners` - Raffle winner management
- And more...

## Backup and Restore

### Backup Database:
```bash
mysqldump -u root -p ngo_kiosk > backup.sql
```

### Restore Database:
```bash
mysql -u root -p ngo_kiosk < backup.sql
``` 