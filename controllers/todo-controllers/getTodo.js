import Todo from '../../models/todo-model.js';
import User from '../../models/user-model.js';
import { redisClient } from '../../db/redisClient.js';

const getTodo = async (req, res) => {
  const userId = req.userId;
  const todoId = req.params.todoId;

  if (!todoId) {
    const error = new Error('Todo ID is required');
    error.statusCode = 400;
    throw error;
  }

  const cacheKey = `todo:${todoId}`;
  const cachedTodo = await redisClient.get(cacheKey);

  const user = await User.findById(userId);

  if (!user) {
    const error = new Error('User not found!');
    error.statusCode = 404;
    throw error;
  }

  let todo;

  if (cachedTodo) {
    try {
      todo = JSON.parse(cachedTodo);
    } catch (error) {
      console.error('Error parsing cached todo:', error);
    }
  }

  if (!todo) {
    // Fetch from database if not in cache or parsing failed
    todo = await Todo.findById(todoId);

    if (!todo) {
      const error = new Error('Todo not found');
      error.statusCode = 404;
      throw error;
    }

    // Cache the todo
    await redisClient.set(cacheKey, JSON.stringify(todo), { EX: 3600 });
  }

  if (user.role !== 'admin' && todo.userId.toString() !== userId) {
    const error = new Error('Not authorized!');
    error.statusCode = 403;
    throw error;
  }

  res.status(200).json({
    message: cachedTodo ? 'Cached Todo fetched.' : 'Todo fetched.',
    todo,
  });
};

export default getTodo;
