import { createClient } from 'redis';

const redisUrl =
  process.env.NODE_ENV === 'test'
    ? process.env.REDIS_URL_TEST
    : process.env.REDIS_URL;

const redisClient = createClient({
  url: redisUrl,
});

const connectToRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

const clearRedis = async () => {
  if (redisClient.isOpen) {
    const keys = await redisClient.keys('*');
    if (keys.length) {
      await redisClient.del(...keys); // Spread the keys array
    }
  } else {
    console.error('Redis client is closed, cannot clear keys.');
  }
};

export { connectToRedis, redisClient, clearRedis };
