import Todo from '../../models/todo-model.js';
import User from '../../models/user-model.js';
import { redisClient } from '../../db/redisClient.js';

const deleteTodosByIds = async (req, res) => {
  const userId = req.userId;
  const { ids } = req.body; // Expecting an array of todo IDs

  console.log('Received request to delete todos:', { userId, ids });

  if (!ids || !Array.isArray(ids)) {
    console.log('Invalid request: ids is not an array');
    const error = new Error('Invalid request. Provide an array of IDs.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId);
  console.log('User found:', user);

  if (!user) {
    console.log('User not found');
    const error = new Error('User not found!');
    error.statusCode = 404;
    throw error;
  }

  // Fetch todos to be deleted
  const todosToDelete = await Todo.find({ _id: { $in: ids } }).lean(); //.lean() is a Mongoose method that returns plain JavaScript objects instead of full Mongoose documents.
  console.log('Todos to delete:', todosToDelete);

  // Authorization check
  if (user.role !== 'admin') {
    const unauthorizedDelete = todosToDelete.some(
      (todo) => todo.userId.toString() !== userId
    ); //some() method returns true if the condition is true for any element in the array, and false otherwise.
    console.log('Unauthorized delete attempt:', { unauthorizedDelete, userId });
    if (unauthorizedDelete) {
      const error = new Error('Not authorized!');
      error.statusCode = 403;
      throw error;
    } //If any todo's userId doesn't match the requesting user's ID, unauthorizedDelete will be set to true.
  }

  // Extract IDs from todos
  const deletedTodosIds = todosToDelete.map((todo) => todo._id);
  console.log('IDs of todos to be deleted:', deletedTodosIds);

  const result = await Todo.deleteMany({ _id: { $in: ids } });

  console.log('deleteTodosByIds result:', result);

  // Delete from Redis
  await Promise.all(
    deletedTodosIds.map((todoId) => redisClient.del(`todo:${todoId}`))
  );

  //   //Update the user's array of todos in Mongo
  if (user.role !== 'admin') {
    const updateResult = await User.findByIdAndUpdate(
      userId,
      {
        $pull: { todos: { $in: deletedTodosIds } },
      },
      { new: true }
    );

    console.log('User todos after update:', updateResult.todos);
  }
  res.json({ message: `Deleted ${result.deletedCount} todos` });
}; // deleteMamy() returns { acknowledged: true, deletedCount: number}

export default deleteTodosByIds;
