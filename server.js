import app from './app.js';
import { connectToMongoDB } from './db/mongoClient.js';
import { connectToRedis } from './db/redisClient.js';

const port = process.env.PORT || 8080;
const mongoUri = process.env.MONGODB_URI;

async function startServer() {
  try {
    await connectToMongoDB(mongoUri);
    console.log('Connected to MongoDB');

    await connectToRedis();
    console.log('Connected to Redis');

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database', error);
    process.exit(1);
  }
}

startServer();
