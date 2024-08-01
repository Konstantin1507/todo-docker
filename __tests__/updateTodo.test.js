import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
// import mongoose from 'mongoose';
import { redisClient } from '../db/redisClient.js';
import Todo from '../models/todo-model.js';
import User from '../models/user-model.js';

describe('PUT /api/todo/:todoId', () => {
  let testTodo;
  let user;
  let token;

  beforeEach(async () => {
    user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    console.log('Created user:', user);
    console.log('UserId', user._id);
    token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

    const newTodo = {
      content: 'Test todo',
      isCompleted: false,
      userId: user._id,
    };

    testTodo = new Todo(newTodo);
    await testTodo.save();
    await redisClient.set(
      `todo:${testTodo._id}`,
      JSON.stringify(testTodo.toObject()),
      {
        EX: 3600,
      }
    );
    console.log('Saved testTodo to MongoDB:', testTodo);
  });

  it('should update an existing todo and cache the updated todo in Redis', async () => {
    console.log('testTodo._id:', testTodo._id);
    const updatedTodoData = {
      content: 'Updated test todo',
      isCompleted: true,
    };

    console.log('Sending update request for todoId:', testTodo._id);

    const response = await request(app)
      .put(`/api/todo/${testTodo._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedTodoData)
      .expect(200);

    console.log('Response body:', response.body);

    expect(response.body.message).toBe('Todo updated successfully!');
    expect(response.body.updatedTodo).toMatchObject(updatedTodoData);
    expect(response.body.updatedTodo.userId).toBe(user._id.toString());
    expect(response.body.user._id).toBe(user._id.toString());
    expect(response.body.user.username).toBe(user.username);

    // Verify that the cache is updated with the new data
    const cachedTodo = await redisClient.get(`todo:${testTodo._id}`);
    const parsedCachedTodo = JSON.parse(cachedTodo);
    expect(parsedCachedTodo.content).toBe(updatedTodoData.content);
    expect(parsedCachedTodo.isCompleted).toBe(updatedTodoData.isCompleted);
    expect(parsedCachedTodo.userId).toBe(user._id.toString());
  });

  // it('should return a 404 if the todo does not exist', async () => {
  //   const nonExistentId = new mongoose.Types.ObjectId();

  //   const response = await request(app)
  //     .put(`/api/todo/${nonExistentId}`)
  //     .set('Authorization', `Bearer ${token}`)
  //     .send({
  //       content: 'Updated non-existent todo',
  //       isCompleted: true,
  //     })
  //     .expect(404);

  //   expect(response.body.message).toBeDefined();
  //   expect(response.body.message).toBe('Todo not found');
  // });

  // it('should return 404 if user is not found', async () => {
  //   const fakeToken = jwt.sign(
  //     { userId: 'fakeUserId' },
  //     process.env.JWT_SECRET
  //   );

  //   const response = await request(app)
  //     .put(`/api/todo/${testTodo._id}`)
  //     .set('Authorization', `Bearer ${fakeToken}`)
  //     .expect(404);

  //   expect(response.body.message).toBe('User not found!');
  // });

  // it('should return 403 if user is not authorized to update the todo', async () => {
  //   // Create a new user
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
  //     .put(`/api/todo/${testTodo._id}`)
  //     .set('Authorization', `Bearer ${unauthorizedToken}`)
  //     .send({ content: "Trying to update someone else's todo" })
  //     .expect(403);

  //   expect(response.body.message).toBe('Not authorized!');
  // });

  // it('should allow partial updates', async () => {
  //   const partialUpdate = { content: 'Partially updated todo' };
  //   const response = await request(app)
  //     .put(`/api/todo/${testTodo._id}`)
  //     .set('Authorization', `Bearer ${token}`)
  //     .send(partialUpdate)
  //     .expect(200);

  //   expect(response.body.updatedTodo.content).toBe(partialUpdate.content);
  //   expect(response.body.updatedTodo.isCompleted).toBe(testTodo.isCompleted);
  // });

  // it('should return 422 if content is not a string', async () => {
  //   const invalidUpdate = { content: 123 };
  //   const response = await request(app)
  //     .put(`/api/todo/${testTodo._id}`)
  //     .set('Authorization', `Bearer ${token}`)
  //     .send(invalidUpdate)
  //     .expect(422);

  //   expect(response.body.errors).toContainEqual({
  //     content: 'Content must be a string',
  //   });
  // });

  // it('should return 422 if content exceeds 100 characters', async () => {
  //   const longContent = 'a'.repeat(101);
  //   const invalidUpdate = { content: longContent };
  //   const response = await request(app)
  //     .put(`/api/todo/${testTodo._id}`)
  //     .set('Authorization', `Bearer ${token}`)
  //     .send(invalidUpdate)
  //     .expect(422);

  //   expect(response.body.errors).toContainEqual({
  //     content: 'Content must be at most 100 characters long',
  //   });
  // });

  // it('should return 422 if isCompleted is not a boolean', async () => {
  //   const invalidUpdate = { isCompleted: 'not a boolean' };
  //   const response = await request(app)
  //     .put(`/api/todo/${testTodo._id}`)
  //     .set('Authorization', `Bearer ${token}`)
  //     .send(invalidUpdate)
  //     .expect(422);

  //   expect(response.body.errors).toContainEqual({
  //     isCompleted: 'isCompleted must be a boolean',
  //   });
  // });
});
