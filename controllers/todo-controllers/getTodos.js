import Todo from '../../models/todo-model.js';
import { redisClient } from '../../db/redisClient.js';

const getTodos = async (req, res) => {
  const { type, page = 1, limit = 3 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const query = { userId: req.userId };
  if (type === 'completed' || type === 'uncompleted') {
    query.isCompleted = type === 'completed';
  }

  // Generate a cache key based on the query parameters
  // const cacheKey = `todos:${JSON.stringify({ query, page, limit })}`;
  // const cachedResult = await redisClient.get(cacheKey);
  // if (cachedResult) {
  //   const parsedResult = JSON.parse(cachedResult);
  //   return res.status(200).json(parsedResult);
  // }

  // If not cached, fetch todos from the database
  const totalTodos = await Todo.countDocuments(query);
  const todos = await Todo.find(query).skip(skip).limit(parseInt(limit));

  // Cache the result in Redis with an expiration time (e.g., 1 hour)
  // await redisClient.setEx(
  //   cacheKey,
  //   3600,
  //   JSON.stringify({
  //     totalTodos,
  //     totalPages: Math.ceil(totalTodos / parseInt(limit)),
  //     currentPage: parseInt(page),
  //     todos,
  //   })
  // );

  res.status(200).json({
    totalTodos,
    totalPages: Math.ceil(totalTodos / parseInt(limit)),
    currentPage: parseInt(page),
    todos,
  });
};

export default getTodos;
