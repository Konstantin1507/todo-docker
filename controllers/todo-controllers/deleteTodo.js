import Todo from '../../models/todo-model.js';
import { redisClient } from '../../db/redisClient.js';

const deleteTodo = async (req, res) => {
  // const userId = req.userId;
  const todoId = req.params.todoId;
  console.log('Received todoId:', todoId);

  const deletedTodo = await Todo.findById(todoId);
  console.log('Found todo:', deletedTodo);

  if (!deletedTodo) {
    const error = new Error('Todo not found');
    error.statusCode = 404;
    throw error;
  }

  // Redis
  await redisClient.del(`todo:${todoId}`);
  console.log('Deleted todo from Redis cache');

  await Todo.deleteOne({ _id: todoId });
  console.log('Deleted todo from MongoDB');

  res
    .status(200)
    .json({ message: 'Todo deleted successfully!', deletedTodo: deletedTodo });
};

export default deleteTodo;
