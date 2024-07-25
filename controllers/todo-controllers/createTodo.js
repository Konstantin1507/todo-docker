import Todo from '../../models/todo-model.js';
import { redisClient } from '../../db/redisClient.js';

const createTodo = async (req, res) => {
  const { content, isCompleted } = req.body;
  console.log('Request body:', req.body);
  // const userId = req.userId;
  const todo = new Todo({
    content,
    isCompleted: isCompleted || false,
    // userId,
  });

  console.log('Todo instance:', todo); // Add this line

  const newTodo = await todo.save();
  console.log('Saved todo:', newTodo); // Add this line

  // Redis
  await redisClient.setEx(`todo:${newTodo._id}`, 3600, JSON.stringify(newTodo));

  res.status(201).json({
    message: 'Todo created successfully!',
    createdTodo: newTodo,
  });
};

export default createTodo;
