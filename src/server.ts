import express, { type Request, type Response } from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import pg from 'pg';

//Load environment variables FIRST
dotenv.config();

//Extract Pool from the pg package
const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 3000;

//Middleware
app.use(express.json()); //Parses JSON data in the request body
app.use(cookieParser()); //Parses HTTP cookies attached to the request

//Initialize the DB Connection Pool
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false //Required for external connection to AWS RDS
  }
});

//Test the DB Connection on Startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Failed to connect to AWS RDS:', err.message);
  } else {
    console.log('Successfully connected to AWS RDS at:', res.rows[0].now);
  }
});

//--- ROUTES ---

//1. Sign Up (Hash password, save to DB)
app.post('/api/register', async (req: Request, res: Response) => {
  res.send('Register route hit')
});

//Login (Verify password, set HttpOnly cookie)
app.post('/api/login', async (req: Request, res: Response) => {
  res.send('Login route hit');
});

//Protected Route (Check for valid cookie before responding)
app.get('/api/dashboard', async (req: Request, res: Response) => {
  res.send('Dashboard data (Protected Route)');
});

//Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});