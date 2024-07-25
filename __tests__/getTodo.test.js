import request from 'supertest';
import app from '../app.js';
import Todo from '../models/todo-model.js';
import mongoose from 'mongoose';
import { redisClient } from '../db/redisClient.js';

describe('GET /api/todo/:todoId', () => {
  let todoId;

  beforeEach(async () => {
    // Create a new todo in the database
    const newTodo = new Todo({
      content: 'Test todo',
      isCompleted: false,
    });
    const savedTodo = await newTodo.save();
    todoId = savedTodo._id.toString();

    // Cache the todo in Redis
    await redisClient.set(
      `todo:${todoId}`,
      JSON.stringify(savedTodo.toObject()),
      {
        EX: 3600,
      }
    );
  });

  afterEach(async () => {
    await Todo.deleteMany({});
    await redisClient.flushAll();
  });

  it('should fetch the todo from the cache if it exists', async () => {
    const response = await request(app)
      .get(`/api/todo/${todoId}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.message).toBe('Cached Todo fetched.');
    expect(response.body.parsedCachedTodo).toMatchObject({
      _id: todoId,
      content: 'Test todo',
      isCompleted: false,
    });
  });

  it('should fetch the todo from the database if it is not in the cache', async () => {
    // Remove the todo from the cache
    await redisClient.del(`todo:${todoId}`);

    const response = await request(app)
      .get(`/api/todo/${todoId}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.message).toBe('Todo fetched.');
    expect(response.body.todo).toMatchObject({
      _id: todoId,
      content: 'Test todo',
      isCompleted: false,
    });

    // Verify that the cache is updated again
    const cachedTodo = await redisClient.get(`todo:${todoId}`);
    const parsedCachedTodo = JSON.parse(cachedTodo);
    expect(parsedCachedTodo.content).toBe('Test todo');
    expect(parsedCachedTodo.isCompleted).toBe(false);
  });

  it('should return a 404 if the todo does not exist', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .get(`/api/todo/${nonExistentId}`)
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body.message).toBe('Todo not found');
  });
});
