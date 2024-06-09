import express from 'express';

// import isAuth from '../middleware/is-auth.js';
import errorHandler from '../middleware/errorHandler.js';
import createTodo from '../controllers/todo-controllers/createTodo.js';
import getTodos from '../controllers/todo-controllers/getTodos.js';
import getTodo from '../controllers/todo-controllers/getTodo.js';
import updateTodo from '../controllers/todo-controllers/updateTodo.js';
import deleteTodo from '../controllers/todo-controllers/deleteTodo.js';
import deleteManyTodos from '../controllers/todo-controllers/deleteManyTodos.js';

const router = express.Router();

router.get('/todos', errorHandler(getTodos));

router.get('/todo/:todoId', errorHandler(getTodo));

router.post('/todos', errorHandler(createTodo));

router.put('/todo/:todoId', errorHandler(updateTodo));

router.delete('/todo/:todoId', errorHandler(deleteTodo));

router.delete('/todos', errorHandler(deleteManyTodos));

export default router;
