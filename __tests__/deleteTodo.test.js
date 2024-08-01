import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import Todo from '../models/todo-model.js';
import User from '../models/user-model.js';
import { redisClient } from '../db/redisClient.js';

describe('DELETE /api/todo/:todoId', () => {
  let testTodo;
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

    testTodo = await Todo.create({
      content: 'Test todo',
      isCompleted: false,
      userId: user._id,
    });

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

  it('should delete the todo and remove it from the cache when user is authorized', async () => {
    console.log('testTodo._id:', testTodo._id);
    const response = await request(app)
      .delete(`/api/todo/${testTodo._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.message).toBe('Todo deleted successfully!');
    expect(response.body.deletedTodo).toMatchObject({
      _id: testTodo._id.toString(),
      content: 'Test todo',
      isCompleted: false,
    });
    //expect(response.body.deletedTodo._id).toBe(testTodo._id.toString());

    const deletedDbTodo = await Todo.findById(testTodo._id);
    expect(deletedDbTodo).toBeNull();

    const deletedCachedTodo = await redisClient.get(`todo:${testTodo._id}`);
    expect(deletedCachedTodo).toBeNull();

    const updatedUser = await User.findById(user._id);
    expect(updatedUser.todos).not.toContain(testTodo._id);
  });

  // it('should delete the todo and remove it from the cache when user is admin', async () => {
  //   console.log('testTodo._id:', testTodo._id);
  //   const response = await request(app)
  //     .delete(`/api/todo/${testTodo._id}`)
  //     .set('Authorization', `Bearer ${adminToken}`)
  //     .expect(200);

  //   expect(response.body.message).toBe('Todo deleted successfully!');
  // });

  // it('should return a 403 if user is not authorized', async () => {
  //   const unauthorizedUser = await User.create({
  //     username: 'unauthorizeduser',
  //     email: 'unauthorized@example.com',
  //     password: 'password123',
  //     role: 'user',
  //   });

  //   const unauthorizedToken = jwt.sign(
  //     { userId: unauthorizedUser._id },
  //     process.env.JWT_SECRET
  //   );

  //   const response = await request(app)
  //     .delete(`/api/todo/${testTodo._id}`)
  //     .set('Authorization', `Bearer ${unauthorizedToken}`)
  //     .expect(403);

  //   expect(response.body.message).toBe('Not authorized!');
  // });

  // it('should return a 404 if the todo does not exist', async () => {
  //   const nonExistentId = new mongoose.Types.ObjectId();

  //   const response = await request(app)
  //     .delete(`/api/todo/${nonExistentId}`)
  //     .set('Authorization', `Bearer ${token}`)
  //     .expect(404);

  //   expect(response.body.message).toBe('Todo not found');
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
