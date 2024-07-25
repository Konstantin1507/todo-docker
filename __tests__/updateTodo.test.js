import request from 'supertest';
import app from '../app.js';
import mongoose from 'mongoose';
import { redisClient } from '../db/redisClient.js';
import Todo from '../models/todo-model.js';

describe('PUT /api/todo/:todoId', () => {
  let testTodo;

  beforeEach(async () => {
    const newTodo = {
      content: 'Test todo',
      isCompleted: false,
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

  afterEach(async () => {
    await Todo.deleteMany({});
    await redisClient.flushAll();
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
      .send(updatedTodoData)
      .expect(200);

    console.log('Response body:', response.body);

    expect(response.body.message).toBe('Todo updated successfully!');
    expect(response.body.updatedTodo).toMatchObject(updatedTodoData);

    // Verify that the cache is updated with the new data
    const cachedTodo = await redisClient.get(`todo:${testTodo._id}`);
    const parsedCachedTodo = JSON.parse(cachedTodo);
    expect(parsedCachedTodo.content).toBe(updatedTodoData.content);
    expect(parsedCachedTodo.isCompleted).toBe(updatedTodoData.isCompleted);
  });

  it('should return a 404 if the todo does not exist', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .put(`/api/todo/${nonExistentId}`)
      .set('Content-Type', 'application/json') // Set the Accept header
      .send({
        content: 'Updated non-existent todo',
        isCompleted: true,
      })
      .expect(404);

    expect(response.body.message).toBeDefined();
    expect(response.body.message).toBe('Todo not found');
  });

  // it('should return a 400 if the request body is invalid', async () => {
  //   const invalidTodoData = {
  //     content: '', // Invalid because content is required and should not be empty
  //     isCompleted: true,
  //   };

  //   const response = await request(app)
  //     .put(`/api/todos/${todoId}`)
  //     .send(invalidTodoData)
  //     .expect('Content-Type', /json/)
  //     .expect(400);

  //   expect(response.body.message).toBe('Invalid request data');
  // });
});
