import Todo from '../../models/todo-model.js';
import { redisClient } from '../../db/redisClient.js';

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
  console.log(result);
  // Delete from Redis
  await Promise.all(
    deletedTodosIds.map((todoId) => redisClient.del(`todo:${todoId}`))
  );
  // Delete from Redis using pipeline
  // const pipeline = redisClient.pipeline();
  // deletedTodosIds.forEach(todoId => pipeline.del(`todo:${todoId}`));
  // await pipeline.exec();

  res.json({ message: `Deleted ${result.deletedCount} ${typeMessage} todos` });
};

export default deleteManyTodos;
