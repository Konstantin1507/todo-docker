import Todo from '../../models/todo-model.js';
import { redisClient } from '../../db/redisClient.js';
import invalidateTodosCache from '../../db/invalidateTodosCache.js';

const deleteTodo = async (req, res) => {
  // const userId = req.userId;
  const todoId = req.params.todoId;

  const deletedTodo = await Todo.findById(todoId);
  if (!deletedTodo) {
    const error = new Error('Todo not found');
    error.statusCode = 404;
    throw error;
  }

  await redisClient.del(`todo:${todoId}`);

  await Todo.deleteOne({ _id: todoId });

  await invalidateTodosCache();

  res
    .status(200)
    .json({ message: 'Todo deleted successfully!', deletedTodo: deletedTodo });
};

export default deleteTodo;
