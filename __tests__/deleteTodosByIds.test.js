import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import Todo from '../models/todo-model.js';
import { redisClient } from '../db/redisClient.js';
import { clearMongoDB, clearRedis } from './test-setup.js';

describe('DELETE /api/todos/by-ids', () => {
  let testTodos;

  beforeEach(async () => {
    await clearMongoDB();
    await clearRedis();

    const todosToInsert = [
      { content: 'Test todo 1', isCompleted: false },
      { content: 'Test todo 2', isCompleted: true },
      { content: 'Test todo 3', isCompleted: false },
    ];

    const insertedTodos = await Todo.insertMany(todosToInsert);

    testTodos = insertedTodos.map((todo) => ({
      _id: todo._id.toString(),
      content: todo.content,
      isCompleted: todo.isCompleted,
    }));

    // Cache the todos
    await Promise.all(
      insertedTodos.map((todo) =>
        redisClient.set(`todo:${todo._id}`, JSON.stringify(todo), { EX: 3600 })
      )
    );
  });

  afterAll(async () => {
    // Clean up the database and cache
    await Todo.deleteMany({});
    await redisClient.flushAll();
  });

  it('should delete todos by their IDs and remove them from the cache', async () => {
    const idsToDelete = testTodos.slice(0, 2).map((todo) => todo._id); // slice(0, 2) creates a new array containing the first two elements of the testTodos array.

    const response = await request(app)
      .delete('/api/todos/by-ids')
      .send({ ids: idsToDelete })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.message).toBe('Deleted 2 todos');

    // Verify todos are deleted from the database
    const remainingTodos = await Todo.find({});
    expect(remainingTodos.length).toBe(1);
    expect(remainingTodos[0].content).toBe('Test todo 3');

    // Verify todos are deleted from the cache
    const cachedTodo1 = await redisClient.get(`todo:${testTodos[0]._id}`);
    const cachedTodo2 = await redisClient.get(`todo:${testTodos[1]._id}`);
    const cachedTodo3 = await redisClient.get(`todo:${testTodos[2]._id}`);

    expect(cachedTodo1).toBeNull();
    expect(cachedTodo2).toBeNull();
    expect(cachedTodo3).not.toBeNull();
  });

  it('should return 400 if the request body is invalid', async () => {
    const response = await request(app)
      .delete('/api/todos/by-ids')
      .send({ ids: 'invalid' })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.message).toBe(
      'Invalid request. Provide an array of IDs.'
    );
  });

  it('should return 200 and zero deleted todos if no IDs match', async () => {
    const nonExistentIds = [
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
    ];

    const response = await request(app)
      .delete('/api/todos/by-ids')
      .send({ ids: nonExistentIds })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.message).toBe('Deleted 0 todos');
  });
});
