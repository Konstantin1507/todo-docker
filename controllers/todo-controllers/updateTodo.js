import Todo from '../../models/todo-model.js';
import User from '../../models/user-model.js';
import { redisClient } from '../../db/redisClient.js';

const updateTodo = async (req, res) => {
  const userId = req.userId;
  const todoId = req.params.todoId;
  console.log('Received todoId:', todoId);
  console.log('Request body:', req.body);

  const user = await User.findById(userId);
  console.log('User:', user);

  if (!user) {
    const error = new Error('User not found!');
    error.statusCode = 404;
    throw error;
  }

  const updatedTodo = await Todo.findById(todoId);
  console.log('Found todo:', updatedTodo);
  if (!updatedTodo) {
    const error = new Error('Todo not found');
    error.statusCode = 404;
    throw error;
  }
  if (updatedTodo.userId.toString() !== userId) {
    const error = new Error('Not authorized!');
    error.statusCode = 403;
    throw error;
  }
  if ('content' in req.body) updatedTodo.content = req.body.content;
  if ('isCompleted' in req.body) updatedTodo.isCompleted = req.body.isCompleted;

  await updatedTodo.save();
  console.log('Updated todo:', updatedTodo);

  // Redis
  await redisClient.setEx(`todo:${todoId}`, 3600, JSON.stringify(updatedTodo));

  res.status(200).json({
    message: 'Todo updated successfully!',
    updatedTodo: updatedTodo,
    user: {
      _id: user._id,
      username: user.username,
    },
  });
};

export default updateTodo;
