import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import Todo from '../models/todo-model.js';
import mongoose from 'mongoose';
import { redisClient } from '../db/redisClient.js';
import User from '../models/user-model.js';

describe('GET /api/todo/:todoId', () => {
  let testTodo;
  let todoId;
  let user;
  let token;
  let adminUser;
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

    testTodo = await Todo.create({
      content: 'Test todo',
      isCompleted: false,
      userId: user._id,
    });

    todoId = testTodo._id.toString();

    await redisClient.set(
      `todo:${testTodo._id}`,
      JSON.stringify(testTodo.toObject()),
      {
        EX: 3600,
      }
    );

    user.todos.push(testTodo._id);
    await user.save();
  });

  it('should fetch the todo from the cache if it exists when user is authorized', async () => {
    const response = await request(app)
      .get(`/api/todo/${todoId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.message).toBe('Cached Todo fetched.');
    expect(response.body.todo).toMatchObject({
      _id: todoId,
      content: 'Test todo',
      isCompleted: false,
    });
  });

  // it('should fetch the todo from the database if it is not in the cache', async () => {
  //   // Remove the todo from the cache
  //   await redisClient.del(`todo:${todoId}`);

  //   const response = await request(app)
  //     .get(`/api/todo/${todoId}`)
  //     .expect('Content-Type', /json/)
  //     .expect(200);

  //   expect(response.body.message).toBe('Todo fetched.');
  //   expect(response.body.todo).toMatchObject({
  //     _id: todoId,
  //     content: 'Test todo',
  //     isCompleted: false,
  //   });

  //   // Verify that the cache is updated again
  //   const cachedTodo = await redisClient.get(`todo:${todoId}`);
  //   const parsedCachedTodo = JSON.parse(cachedTodo);
  //   expect(parsedCachedTodo.content).toBe('Test todo');
  //   expect(parsedCachedTodo.isCompleted).toBe(false);
  // });

  // it('should return a 404 if the todo does not exist', async () => {
  //   const nonExistentId = new mongoose.Types.ObjectId();
  //   const response = await request(app)
  //     .get(`/api/todo/${nonExistentId}`)
  //     .expect('Content-Type', /json/)
  //     .expect(404);

  //   expect(response.body.message).toBe('Todo not found');
  // });
});
