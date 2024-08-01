import Todo from '../../models/todo-model.js';
import User from '../../models/user-model.js';
import { redisClient } from '../../db/redisClient.js';

const createTodo = async (req, res) => {
  const { content, isCompleted } = req.body;
  console.log('Request body:', req.body);

  const userId = req.userId;
  console.log('User ID:', userId);

  const user = await User.findById(userId);
  console.log('User fetched:', user);

  if (!user) {
    const error = new Error('User not found!');
    error.statusCode = 404;
    throw error;
  }

  const todo = new Todo({
    content,
    isCompleted: isCompleted || false,
    userId: userId,
  });

  console.log('Todo instance:', todo);

  const newTodo = await todo.save();
  console.log('Saved todo:', newTodo);

  user.todos.push(newTodo._id);
  await user.save();
  console.log('Updated user todos:', user.todos);

  // Redis
  const redisResponse = await redisClient.setEx(
    `todo:${newTodo._id}`,
    3600,
    JSON.stringify(newTodo)
  );
  console.log('Redis setEx response:', redisResponse);

  res.status(201).json({
    message: 'Todo created successfully!',
    createdTodo: newTodo,
    user: { _id: userId, username: user.username },
  });
};

export default createTodo;
