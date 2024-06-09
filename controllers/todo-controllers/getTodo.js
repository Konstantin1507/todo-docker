import Todo from '../../models/todo-model.js';
import { redisClient } from '../../db/redisClient.js';

const getTodo = async (req, res) => {
  // const userId = req.userId;
  const todoId = req.params.todoId;

  const cacheKey = `todo:${todoId}`;
  const cachedTodo = await redisClient.get(cacheKey);

  if (cachedTodo) {
    const parsedCachedTodo = JSON.parse(cachedTodo);
    return res
      .status(200)
      .json({ message: 'Cashed Todo fetched.', parsedCachedTodo });
  }

  const todo = await Todo.findById(todoId);

  if (!todo) {
    const error = new Error('Todo not found');
    error.statusCode = 404;
    throw error;
  }
  await redisClient.set(cacheKey, JSON.stringify(todo), { EX: 3600 }); // Cache for 1 hour
  res.status(200).json(todo);

  // if (todo.userId !== userId) {
  //   const error = new Error('Not authorized!');
  //   error.statusCode = 404;
  //   throw error;
  // }
  res.status(200).json({ message: 'Todo fetched.', todo });
};

export default getTodo;
