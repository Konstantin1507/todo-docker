import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import Todo from '../models/todo-model.js';
import { redisClient } from '../db/redisClient.js';
// import { clearMongoDB, clearRedis } from './test-setup.js';

describe('DELETE /api/todo/:todoId', () => {
  let testTodo;

  beforeEach(async () => {
    const newTodo = {
      content: 'Test todo',
      isCompleted: false,
    };

    const newTodoInstance = new Todo(newTodo);
    testTodo = await newTodoInstance.save();
    await redisClient.set(
      `todo:${testTodo._id}`,
      JSON.stringify(testTodo.toObject()),
      {
        EX: 3600,
      }
    );
  });

  afterEach(async () => {
    await Todo.deleteMany({});
    await redisClient.flushAll();
  });

  it('should delete the todo and remove it from the cache', async () => {
    console.log('testTodo._id:', testTodo._id);
    const response = await request(app)
      .delete(`/api/todo/${testTodo._id}`)
      .expect(200);

    expect(response.body.message).toBe('Todo deleted successfully!');
    expect(response.body.deletedTodo).toMatchObject({
      _id: testTodo._id.toString(),
      content: 'Test todo',
      isCompleted: false,
    });

    const deletedDbTodo = await Todo.findById(testTodo._id);
    expect(deletedDbTodo).toBeNull();

    const deletedCachedTodo = await redisClient.get(`todo:${testTodo._id}`);
    expect(deletedCachedTodo).toBeNull();
  });

  it('should return a 404 if the todo does not exist', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .delete(`/api/todo/${nonExistentId}`)
      .expect(404);

    expect(response.body.message).toBe('Todo not found');
  });
});
