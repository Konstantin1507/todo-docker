import Todo from '../../models/todo-model.js';
import User from '../../models/user-model.js';

const getTodos = async (req, res) => {
  const userId = req.userId;
  const { type, page = 1, limit = 3 } = req.query;
  console.log('Received query parameters:', req.query);
  const skip = (parseInt(page) - 1) * parseInt(limit);
  console.log('Skip value:', skip);

  const user = await User.findById(userId);

  if (!user) {
    const error = new Error('User not found!');
    error.statusCode = 404;
    throw error;
  }

  let query = {};
  if (user.role !== 'admin') {
    query.userId = userId;
  }

  if (type === 'completed' || type === 'uncompleted') {
    query.isCompleted = type === 'completed';
  }

  console.log('Query object:', query);

  const totalTodos = await Todo.countDocuments(query);
  console.log('Total todos:', totalTodos);

  const todos = await Todo.find(query).skip(skip).limit(parseInt(limit)).exec();

  if (user.role !== 'admin') {
    const unauthorizedAccess = todos.some(
      (todo) => todo.userId.toString() !== userId
    );
    if (unauthorizedAccess) {
      const error = new Error('Not authorized!');
      error.statusCode = 403;
      throw error;
    }
  }
  console.log('Fetched todos:', todos);

  res.status(200).json({
    totalTodos,
    totalPages: Math.ceil(totalTodos / parseInt(limit)),
    currentPage: parseInt(page),
    todos,
  });
};

export default getTodos;
