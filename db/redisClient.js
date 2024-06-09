import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
  url: redisUrl,
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

await redisClient.connect();

// import { promisify } from 'util';

// const setexAsync = promisify(client.set).bind(client);
// const getAsync = promisify(client.get).bind(client);

// export { client, setexAsync, getAsync };
export { redisClient };
