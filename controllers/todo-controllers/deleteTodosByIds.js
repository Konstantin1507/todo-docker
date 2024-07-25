import Todo from '../../models/todo-model.js';
import { redisClient } from '../../db/redisClient.js';

const deleteTodosByIds = async (req, res) => {
  console.log('deleteTodosByIds controller invoked'); // Debugging line
  const { ids } = req.body; // Expecting an array of todo IDs

  if (!ids || !Array.isArray(ids)) {
    return res
      .status(400)
      .json({ message: 'Invalid request. Provide an array of IDs.' });
  }

  // Fetch todos to be deleted
  const todosToDelete = await Todo.find({ _id: { $in: ids } });

  // Extract IDs from todos
  const deletedTodosIds = todosToDelete.map((todo) => todo._id);

  const result = await Todo.deleteMany({ _id: { $in: ids } });

  console.log('deleteMany result:', result); // Debugging line

  // Delete from Redis
  await Promise.all(
    deletedTodosIds.map((todoId) => redisClient.del(`todo:${todoId}`))
  );

  res.json({ message: `Deleted ${result.deletedCount} todos` });
}; // deleteMamy() returns { acknowledged: true, deletedCount: number}

export default deleteTodosByIds;
