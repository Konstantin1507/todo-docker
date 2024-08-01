import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import { redisClient } from '../db/redisClient.js';
import Todo from '../models/todo-model.js';
import User from '../models/user-model.js';

describe('DELETE /api/todos', () => {
  let testTodos;
  let user;
  let adminUser;
  let token;
  let adminToken;

  beforeEach(async () => {
    user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
    });

    adminUser = await User.create({
      username: 'adminuser',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    });

    token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

    adminToken = jwt.sign({ userId: adminUser._id }, process.env.JWT_SECRET);

    testTodos = await Todo.create([
      { content: 'Test todo 1', isCompleted: false, userId: user._id },
      { content: 'Test todo 2', isCompleted: true, userId: user._id },
      { content: 'Test todo 3', isCompleted: false, userId: user._id },
      { content: 'Test todo 4', isCompleted: true, userId: user._id },
    ]);

    user.todos = testTodos.map((todo) => todo._id);
    await user.save();

    // Cache the todos in Redis
    await Promise.all(
      testTodos.map((todo) =>
        redisClient.set(`todo:${todo._id}`, JSON.stringify(todo.toObject()), {
          EX: 3600,
        })
      )
    );
  });

  it('should delete all completed todos for authorized user', async () => {
    const response = await request(app)
      .delete('/api/todos?type=completed')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.message).toBe('Deleted 2 completed todos');

    const remainingTodos = await Todo.find({});
    expect(remainingTodos.length).toBe(2);
    expect(remainingTodos.every((todo) => !todo.isCompleted)).toBe(true); // is checking that every remaining todo is not completed (i.e., isCompleted is false).

    // Verify user's todos are updated
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.todos).toHaveLength(2);

    // Check Redis cache
    const cachedTodos = await Promise.all(
      testTodos.map((todo) => redisClient.get(`todo:${todo._id}`))
    );
    console.log(cachedTodos);
    cachedTodos.forEach((cachedTodo, index) => {
      if (testTodos[index].isCompleted) {
        expect(cachedTodo).toBeNull();
      } else {
        expect(cachedTodo).not.toBeNull();
        if (cachedTodo) {
          expect(JSON.parse(cachedTodo)._id).toBe(String(testTodos[index]._id));
        }
      }
    });
  });

  // it('should delete all uncompleted todos for admin', async () => {
  //   const response = await request(app)
  //     .delete('/api/todos?type=uncompleted')
  //     // .query({ type: 'uncompleted' })
  //     .set('Authorization', `Bearer ${adminToken}`)
  //     .expect(200);

  //   expect(response.body.message).toBe('Deleted 2 uncompleted todos');

  //   const remainingTodos = await Todo.find({});
  //   expect(remainingTodos.length).toBe(2);
  //   expect(remainingTodos.every((todo) => todo.isCompleted)).toBe(true);

  //   const updatedUser = await User.findById(user._id);
  //   expect(updatedUser.todos).toHaveLength(2);

  //   // Check Redis cache
  //   const cachedTodos = await Promise.all(
  //     testTodos.map((todo) => redisClient.get(`todo:${todo._id}`))
  //   );
  //   cachedTodos.forEach((cachedTodo, index) => {
  //     if (!testTodos[index].isCompleted) {
  //       expect(cachedTodo).toBeNull();
  //     } else {
  //       expect(cachedTodo).not.toBeNull();
  //       if (cachedTodo) {
  //         expect(JSON.parse(cachedTodo)._id).toBe(String(testTodos[index]._id));
  //       }
  //     }
  //   });
  // });

  // it('should delete all todos if no type is specified', async () => {
  //   const response = await request(app)
  //     .delete('/api/todos')
  //     .set('Authorization', `Bearer ${token}`)
  //     .expect(200);

  //   expect(response.body.message).toBe('Deleted 4 all todos');

  //   const remainingTodos = await Todo.find({});
  //   expect(remainingTodos.length).toBe(0);

  //   const updatedUser = await User.findById(user._id);
  //   expect(updatedUser.todos).toHaveLength(0);

  //   // Check Redis cache
  //   const cachedTodos = await Promise.all(
  //     testTodos.map((todo) => redisClient.get(`todo:${todo._id}`))
  //   );
  //   cachedTodos.forEach((cachedTodo) => {
  //     expect(cachedTodo).toBeNull();
  //   });
  // });

  // it('should return 404 if user is not found', async () => {
  //   const fakeToken = jwt.sign(
  //     { userId: 'fakeUserId' },
  //     process.env.JWT_SECRET
  //   );

  //   const response = await request(app)
  //     .delete('/api/todos')
  //     .set('Authorization', `Bearer ${fakeToken}`)
  //     .expect(404);

  //   expect(response.body.message).toBe('User not found!');
  // });
});
