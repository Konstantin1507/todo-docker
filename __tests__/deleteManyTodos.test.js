import request from 'supertest';
import app from '../app.js';
import { redisClient } from '../db/redisClient.js';
import Todo from '../models/todo-model.js';
import { clearMongoDB, clearRedis } from './test-setup.js';

describe('DELETE /api/todos', () => {
  let testTodos;

  beforeEach(async () => {
    // await clearMongoDB();
    // await clearRedis();

    // Create test todos
    const todosToInsert = [
      { content: 'Test todo 1', isCompleted: false },
      { content: 'Test todo 2', isCompleted: true },
      { content: 'Test todo 3', isCompleted: false },
      { content: 'Test todo 4', isCompleted: true },
    ];

    const insertedTodos = await Todo.insertMany(todosToInsert);

    testTodos = insertedTodos.map((todo) => ({
      _id: todo._id.toString(),
      content: todo.content,
      isCompleted: todo.isCompleted,
    }));

    // Cache the todos in Redis
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

  it('should delete all completed todos', async () => {
    const response = await request(app)
      .delete('/api/todos?type=completed')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.message).toBe('Deleted 2 completed todos');

    const remainingTodos = await Todo.find({});
    expect(remainingTodos.length).toBe(2);
    expect(remainingTodos.every((todo) => !todo.isCompleted)).toBe(true); // is checking that every remaining todo is not completed (i.e., isCompleted is false).

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

  it('should delete all uncompleted todos', async () => {
    const response = await request(app)
      .delete('/api/todos')
      .query({ type: 'uncompleted' })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.message).toBe('Deleted 2 uncompleted todos');

    const remainingTodos = await Todo.find({});
    expect(remainingTodos.length).toBe(2);
    expect(remainingTodos.every((todo) => todo.isCompleted)).toBe(true);

    // Check Redis cache
    const cachedTodos = await Promise.all(
      testTodos.map((todo) => redisClient.get(`todo:${todo._id}`))
    );
    cachedTodos.forEach((cachedTodo, index) => {
      if (!testTodos[index].isCompleted) {
        expect(cachedTodo).toBeNull();
      } else {
        expect(cachedTodo).not.toBeNull();
        if (cachedTodo) {
          expect(JSON.parse(cachedTodo)._id).toBe(String(testTodos[index]._id));
        }
      }
    });
  });

  it('should delete all todos if no type is specified', async () => {
    const response = await request(app)
      .delete('/api/todos')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.message).toBe('Deleted 4 all todos');

    const remainingTodos = await Todo.find({});
    expect(remainingTodos.length).toBe(0);

    // Check Redis cache
    const cachedTodos = await Promise.all(
      testTodos.map((todo) => redisClient.get(`todo:${todo._id}`))
    );
    cachedTodos.forEach((cachedTodo) => {
      expect(cachedTodo).toBeNull();
    });
  });
});
