import mongoose from 'mongoose';
import { connectToMongoDB, disconnectFromMongoDB } from '../db/mongoClient';
import { connectToRedis, redisClient, clearRedis } from '../db/redisClient';

const clearMongoDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

beforeAll(async () => {
  console.log('Connecting to MongoDB and Redis...');
  await connectToMongoDB(process.env.MONGODB_URI_TEST);
  await connectToRedis();
});

beforeEach(async () => {
  await clearMongoDB();
  await clearRedis();
});

// afterEach(async () => {
//   await User.deleteMany({});
//   await redisClient.flushall();
// });

afterAll(async () => {
  console.log('Clearing MongoDB and Redis...');
  await clearMongoDB();
  await clearRedis();

  console.log('Disconnecting from MongoDB and Redis...');
  await disconnectFromMongoDB();
  await redisClient.quit();
});

export { clearMongoDB, clearRedis };
