import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createTables() {
  const createUserTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    console.log('Generating tables in AWS RDS...');
    await pool.query(createUserTable);
    console.log('Users table created successfully.');
  } catch (error) {
    console.error('Error creating user tables:', error);
  } finally {
    //Close the database connection so the script can exit
    await pool.end();
  }
}

createTables();