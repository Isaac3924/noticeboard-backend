import express, { type Request, type Response } from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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
app.post('/api/register', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    //Reject empty requests
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    //Hash the password (10 salt rounds is industry standard)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    //Save to AWS RDS using parameterized queries to prevent SQL injection
    const insertQuery = `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, email, created_at;
    `;
    const result = await pool.query(insertQuery, [email, passwordHash]);

    //Send back the new user data (excluding the password hash)
    res.status(201).json({
      message: 'User registered successfully',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Registering error:', error);

    //Postgress error code '23505' means "Unique Violation" (email already exists)
    if ((error as any).code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }

    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Login (Verify password, set HttpOnly cookie)
app.post('/api/login', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    //Fetch the user from the database
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(userQuery, [email]);
    const user = result.rows[0];

    //If user does not exist, return a generic error for security
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    //Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    //Generate a JWT
    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      process.env.JWT_SECRET as string, 
      { expiresIn: '1h' }
    );

    //Set the secure HttpOnly cookie
    res.cookie('auth_token', token, { 
      httpOnly: true, //Prevents JavaScript (XSS) from reading the cookie
      secure: process.env.NODE_ENV === 'production', //Requires HTTPS in production
      maxAge: 3600000 //1 hour in milliseconds
    });

    res.status(200).json({ message: 'Logged in successfully' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Protected Route (Check for valid cookie before responding)
app.get('/api/dashboard', async (req: Request, res: Response) => {
  res.send('Dashboard data (Protected Route)');
});

//Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});