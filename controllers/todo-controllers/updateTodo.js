import Todo from '../../models/todo-model.js';
import { redisClient } from '../../db/redisClient.js';

const updateTodo = async (req, res) => {
  // const userId = req.userId;
  const todoId = req.params.todoId;
  console.log('Received todoId:', todoId);
  const { content, isCompleted } = req.body;
  console.log('Received content:', content, 'isCompleted:', isCompleted);

  const updatedTodo = await Todo.findById(todoId);
  console.log('Found todo:', updatedTodo);
  if (!updatedTodo) {
    const error = new Error('Todo not found');
    error.statusCode = 404;
    throw error;
  }

  updatedTodo.content = content;
  updatedTodo.isCompleted = isCompleted;
  await updatedTodo.save();

  // Redis
  await redisClient.setEx(`todo:${todoId}`, 3600, JSON.stringify(updatedTodo));

  res.status(200).json({
    message: 'Todo updated successfully!',
    updatedTodo: updatedTodo,
  });
};

export default updateTodo;
