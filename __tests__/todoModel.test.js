import mongoose from 'mongoose';
import Todo from '../models/todo-model.js';
import User from '../models/user-model.js';

describe('Todo Model Test', () => {
  let user;

  beforeEach(async () => {
    user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    await user.save();
  });

  it('should create & save todo successfully', async () => {
    const validTodo = new Todo({
      content: 'Test todo',
      isCompleted: false,
      userId: user._id,
    });
    const savedTodo = await validTodo.save();

    expect(savedTodo._id).toBeDefined();
    expect(savedTodo.content).toBe('Test todo');
    expect(savedTodo.isCompleted).toBe(false);
    expect(savedTodo.userId).toBe(user._id);
  });

  // it('should allow saving todo without userId', async () => {
  //   const todo = new Todo({
  //     content: 'Test todo',
  //     isCompleted: false,
  //   });

  //   let savedTodo;
  //   try {
  //     savedTodo = await todo.save();
  //   } catch (error) {
  //     console.error(error);
  //   }

  //   expect(savedTodo).toBeDefined();
  //   expect(savedTodo.content).toBe('Test todo');
  //   expect(savedTodo.isCompleted).toBe(false);
  //   expect(savedTodo.userId).toBeUndefined();
  // });

  it('should fail to save todo with invalid data', async () => {
    const invalidTodo = new Todo({
      content: '',
      isCompleted: false,
      userId: user._id,
    });
    let err;
    try {
      await invalidTodo.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.content).toBeDefined();
  });
});
