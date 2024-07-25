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

// const clearRedis = async () => {
//   const keys = await redisClient.keys('*');
//   if (keys.length) {
//     await redisClient.del(keys);
//   }
// };

// beforeAll(async () => {
//   await connectToMongoDB(process.env.MONGODB_URI_TEST);
//   await clearMongoDB();
//   await clearRedis();
// });

beforeAll(async () => {
  console.log('Connecting to MongoDB and Redis...');
  await connectToMongoDB(process.env.MONGODB_URI_TEST);
  await connectToRedis();

  console.log('Clearing MongoDB and Redis...');
  await clearMongoDB();
  await clearRedis();
});

beforeEach(async () => {
  await clearMongoDB();
  await clearRedis();
});

// afterAll(async () => {
//   await clearMongoDB();
//   await disconnectFromMongoDB();
//   await clearRedis();
//   await redisClient.quit();
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
