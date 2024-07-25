import Todo from '../../models/todo-model.js';

const getTodos = async (req, res) => {
  const { type, page = 1, limit = 3 } = req.query;
  console.log('Received query parameters:', req.query);
  const skip = (parseInt(page) - 1) * parseInt(limit);
  console.log('Skip value:', skip);

  // const query = { userId: req.userId };
  let query = {};
  if (type === 'completed' || type === 'uncompleted') {
    // query.isCompleted = type === 'completed';
    query = { ...query, isCompleted: type === 'completed' };
    console.log('Query object:', query);
  } else {
    console.log('No filter applied, fetching all todos');
  }

  const totalTodos = await Todo.countDocuments(query);
  console.log('Total todos:', totalTodos);

  const todos = await Todo.find(query).skip(skip).limit(parseInt(limit)).exec();
  console.log('Fetched todos:', todos);

  res.status(200).json({
    totalTodos,
    totalPages: Math.ceil(totalTodos / parseInt(limit)),
    currentPage: parseInt(page),
    todos,
  });
};

export default getTodos;
