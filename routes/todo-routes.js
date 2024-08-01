import express from 'express';

import isAuth from '../middleware/is-auth.js';
import errorHandler from '../middleware/errorHandler.js';
import createTodo from '../controllers/todo-controllers/createTodo.js';
import getTodos from '../controllers/todo-controllers/getTodos.js';
import getTodo from '../controllers/todo-controllers/getTodo.js';
import updateTodo from '../controllers/todo-controllers/updateTodo.js';
import deleteTodo from '../controllers/todo-controllers/deleteTodo.js';
import deleteManyTodos from '../controllers/todo-controllers/deleteManyTodos.js';
import deleteTodosByIds from '../controllers/todo-controllers/deleteTodosByIds.js';
import {
  todoCreateValidationRules,
  todoUpdateValidationRules,
} from '../validators/todoValidation.js';
import validate from '../middleware/validate.js';

const router = express.Router();

router.get('/todos', isAuth, errorHandler(getTodos));
router.get('/todo/:todoId', isAuth, errorHandler(getTodo));
router.post(
  '/todos',
  isAuth,
  todoCreateValidationRules(), // Returns an array of validation rules (middleware)
  validate, // Is a middleware function itself
  errorHandler(createTodo)
);
router.put(
  '/todo/:todoId',
  isAuth,
  todoUpdateValidationRules(),
  validate,
  errorHandler(updateTodo)
);
router.delete('/todo/:todoId', isAuth, errorHandler(deleteTodo));
router.delete('/todos', isAuth, errorHandler(deleteManyTodos));
router.delete('/todos/by-ids', isAuth, errorHandler(deleteTodosByIds));

export default router;
