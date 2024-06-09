import Todo from '../../models/todo-model.js';
import { redisClient } from '../../db/redisClient.js';
import invalidateTodosCache from '../../db/invalidateTodosCache.js';

const deleteManyTodos = async (req, res) => {
  const { type } = req.query;

  let query = {};
  let typeMessage = 'all'; // Default type message
  if (type === 'completed') {
    query.isCompleted = true;
    typeMessage = 'completed';
  } else if (type === 'uncompleted') {
    query.isCompleted = false;
    typeMessage = 'uncompleted';
  }

  // Fetch IDs of todos to be deleted
  const todosToDelete = await Todo.find(query);

  // Extract IDs from todos
  const deletedTodosIds = todosToDelete.map((todo) => todo._id);

  const result = await Todo.deleteMany(query);

  await Promise.all(
    deletedTodosIds.map((todoId) => redisClient.del(`todo:${todoId}`))
  );

  await invalidateTodosCache();

  res.json({ message: `Deleted ${result.deletedCount} ${typeMessage} todos` });
};

export default deleteManyTodos;
