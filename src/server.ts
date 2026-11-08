import express, { type Request, type Response } from 'express';

const app = express();
const port = process.env.PORT || 3000;

//Middleware to parse incoming JSON requests
app.use(express.json());

//Simple test route
app.get('/', (req: Request, res: Response) => {
  res.send('Noticeboard Backend is running securely');
});

//Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});