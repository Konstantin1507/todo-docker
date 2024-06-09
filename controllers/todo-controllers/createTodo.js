import Todo from '../../models/todo-model.js';
import { redisClient } from '../../db/redisClient.js';
import invalidateTodosCache from '../../db/invalidateTodosCache.js';

const createTodo = async (req, res) => {
  const { content, isCompleted } = req.body;
  // const userId = req.userId;
  const todo = new Todo({
    content,
    isCompleted: isCompleted || false,
    // userId,
  });

  const newTodo = await todo.save();
  // Redis
  await redisClient.setEx(`todo:${newTodo._id}`, 3600, JSON.stringify(newTodo));

  await invalidateTodosCache();

  res.status(201).json({
    message: 'Todo created successfully!',
    createdTodo: newTodo,
  });
};

export default createTodo;
