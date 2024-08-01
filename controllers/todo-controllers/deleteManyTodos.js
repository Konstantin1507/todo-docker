import Todo from '../../models/todo-model.js';
import User from '../../models/user-model.js';
import { redisClient } from '../../db/redisClient.js';

const deleteManyTodos = async (req, res) => {
  const userId = req.userId;
  const { type } = req.query;

  const user = await User.findById(userId);

  if (!user) {
    const error = new Error('User not found!');
    error.statusCode = 404;
    throw error;
  }

  let query = user.role === 'admin' ? {} : { userId: userId }; //if the user is  admin, query - empty object {} allowing  admin to delete all todos
  let typeMessage = 'all'; // Default type message
  if (type === 'completed') {
    query.isCompleted = true;
    typeMessage = 'completed';
  } else if (type === 'uncompleted') {
    query.isCompleted = false;
    typeMessage = 'uncompleted';
  }

  // Fetch  todos to be deleted
  const todosToDelete = await Todo.find(query);

  // Authorization check
  if (user.role !== 'admin') {
    const unauthorizedDelete = todosToDelete.some(
      (todo) => todo.userId.toString() !== userId
    ); //some() method returns true if the condition is true for any element in the array, and false otherwise.
    if (unauthorizedDelete) {
      const error = new Error('Not authorized!');
      error.statusCode = 403;
      throw error;
    } //If any todo's userId doesn't match the requesting user's ID, unauthorizedDelete will be set to true.
  }

  // Extract IDs from todos
  const deletedTodosIds = todosToDelete.map((todo) => todo._id);

  const result = await Todo.deleteMany(query);
  console.log('deleteMany result:', result);
  // Delete from Redis
  await Promise.all(
    deletedTodosIds.map((todoId) => redisClient.del(`todo:${todoId}`))
  );

  //Update the user's array of todos in Mongo
  if (user.role !== 'admin') {
    await User.findByIdAndUpdate(userId, {
      $pull: { todos: { $in: deletedTodosIds } },
    });
  }

  res.json({ message: `Deleted ${result.deletedCount} ${typeMessage} todos` });
};

export default deleteManyTodos;
