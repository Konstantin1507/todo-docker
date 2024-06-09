import Todo from '../../models/todo-model.js';
import { redisClient } from '../../db/redisClient.js';
import invalidateTodosCache from '../../db/invalidateTodosCache.js';

const updateTodo = async (req, res) => {
  // const userId = req.userId;
  const todoId = req.params.todoId;
  const { content, isCompleted } = req.body;

  const updatedTodo = await Todo.findById(todoId);
  if (!updatedTodo) {
    const error = new Error('Todo not found');
    error.statusCode = 404;
    throw error;
  }

  updatedTodo.content = content;
  updatedTodo.isCompleted = isCompleted;
  await updatedTodo.save();

  await redisClient.setEx(`todo:${todoId}`, 3600, JSON.stringify(updatedTodo));

  await invalidateTodosCache();

  res.status(200).json({
    message: 'Todo updated successfully!',
    updatedTodo: updatedTodo,
  });
};

export default updateTodo;
