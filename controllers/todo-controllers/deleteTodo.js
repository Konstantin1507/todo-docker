import Todo from '../../models/todo-model.js';
import User from '../../models/user-model.js';
import { redisClient } from '../../db/redisClient.js';

const deleteTodo = async (req, res) => {
  const userId = req.userId;
  const todoId = req.params.todoId;
  console.log('Received todoId:', todoId);

  const deletedTodo = await Todo.findById(todoId);
  console.log('Found todo:', deletedTodo);

  if (!deletedTodo) {
    const error = new Error('Todo not found');
    error.statusCode = 404;
    throw error;
  }

  const user = await User.findById(userId);

  if (!user) {
    const error = new Error('User not found!');
    error.statusCode = 404;
    throw error;
  }

  if (user.role !== 'admin' && deletedTodo.userId.toString() !== userId) {
    const error = new Error('Not authorized!');
    error.statusCode = 403;
    throw error;
  }

  await Todo.deleteOne({ _id: todoId });
  console.log('Deleted todo from MongoDB');
  // await user.updateOne({ $pull: { todos: deletedTodo._id } });
  await user.todos.pull(deletedTodo._id);
  await user.save();

  // Redis
  await redisClient.del(`todo:${todoId}`);
  console.log('Deleted todo from Redis cache');

  res
    .status(200)
    .json({ message: 'Todo deleted successfully!', deletedTodo: deletedTodo });
};

export default deleteTodo;
