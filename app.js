import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const port = process.env.PORT || 8080;

// import authRoutes from './routes/auth.js';
import todoRoutes from './routes/todo-routes.js';

const app = express();

app.use(express.json());
app.use(cors());

// app.use('/auth', authRoutes);
app.get('/', (req, res) => {
  res.send(`<h2>It's Working!</h2>`);
});

app.use('/api', todoRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message || 'Something went wrong';
  res.status(status).json({ message: message });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then((result) => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => console.log(err));
