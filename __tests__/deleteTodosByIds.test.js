import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import Todo from '../models/todo-model.js';
import User from '../models/user-model.js';
import { redisClient } from '../db/redisClient.js';

describe('DELETE /api/todos/by-ids', () => {
  let testTodos;
  let user;
  let adminUser;
  let token;
  let adminToken;
  let todoIds;

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
    ]);

    todoIds = testTodos.map((todo) => todo._id.toString());

    user.todos = testTodos.map((todo) => todo._id);
    await user.save();

    // Cache the todos
    await Promise.all(
      testTodos.map((todo) =>
        redisClient.set(`todo:${todo._id}`, JSON.stringify(todo.toObject()), {
          EX: 3600,
        })
      )
    );
  });

  it('should delete todos for authorized user by their IDs and remove them from the cache', async () => {
    const idsToDelete = testTodos
      .slice(0, 2)
      .map((todo) => todo._id.toString());

    const response = await request(app)
      .delete('/api/todos/by-ids')
      .set('Authorization', `Bearer ${token}`)
      .send({ ids: idsToDelete })
      .expect(200);

    expect(response.body.message).toBe('Deleted 2 todos');

    // Verify todos are deleted from the database
    const remainingTodos = await Todo.find({});
    expect(remainingTodos.length).toBe(1);
    expect(remainingTodos[0].content).toBe('Test todo 3');

    // Verify user's todos are updated
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.todos).toHaveLength(1);

    // Verify todos are deleted from the cache
    const cachedTodos = await Promise.all(
      testTodos.map((todo) => redisClient.get(`todo:${todo._id}`))
    );
    expect(cachedTodos[0]).toBeNull();
    expect(cachedTodos[1]).toBeNull();
    expect(cachedTodos[2]).not.toBeNull();
  });

  // it('should allow admin to delete any todos', async () => {
  //   const response = await request(app)
  //     .delete('/api/todos/by-ids')
  //     .set('Authorization', `Bearer ${adminToken}`)
  //     .send({ ids: todoIds })
  //     .expect(200);

  //   expect(response.body.message).toBe('Deleted 3 todos');
  // });

  // it('should return 400 if the request body is invalid', async () => {
  //   const response = await request(app)
  //     .delete('/api/todos/by-ids')
  //     .set('Authorization', `Bearer ${token}`)
  //     .send({ ids: 'invalid' })
  //     .expect(400);

  //   expect(response.body.message).toBe(
  //     'Invalid request. Provide an array of IDs.'
  //   );
  // });

  // it('should return 200 and zero deleted todos if no IDs match', async () => {
  //   const nonExistentIds = [
  //     new mongoose.Types.ObjectId(),
  //     new mongoose.Types.ObjectId(),
  //   ];

  //   const response = await request(app)
  //     .delete('/api/todos/by-ids')
  //     .set('Authorization', `Bearer ${token}`)
  //     .send({ ids: nonExistentIds })
  //     .expect(200);

  //   expect(response.body.message).toBe('Deleted 0 todos');
  // });

  // it('should return 403 if user is not authorized to delete todos', async () => {
  //   const unauthorizedUser = await User.create({
  //     username: 'unauthorized',
  //     email: 'unauthorized@example.com',
  //     password: 'password123',
  //     role: 'user',
  //   });
  //   const unauthorizedToken = jwt.sign(
  //     { userId: unauthorizedUser._id },
  //     process.env.JWT_SECRET
  //   );

  //   const response = await request(app)
  //     .delete('/api/todos/by-ids')
  //     .set('Authorization', `Bearer ${unauthorizedToken}`)
  //     .send({ ids: todoIds })
  //     .expect(403);

  //   expect(response.body.message).toBe('Not authorized!');
  // });

  // it('should return 404 if user is not found', async () => {
  //   const fakeToken = jwt.sign(
  //     { userId: 'fakeUserId' },
  //     process.env.JWT_SECRET
  //   );

  //   const response = await request(app)
  //     .delete('/api/todos/by-ids')
  //     .set('Authorization', `Bearer ${fakeToken}`)
  //     .expect(404);

  //   expect(response.body.message).toBe('User not found!');
  // });
});
