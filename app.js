import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import todoRoutes from './routes/todo-routes.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// app.get('/', (req, res) => {
//   res.send(`<h2>It's Working!</h2>`);
// });

app.use('/api', todoRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message || 'Something went wrong';
  res.status(status).json({ message: message });
});

export default app;
