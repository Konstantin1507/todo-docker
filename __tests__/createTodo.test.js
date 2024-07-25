import request from 'supertest';
import app from '../app.js';
import { redisClient } from '../db/redisClient.js';
// import Todo from '../models/todo-model.js';

describe('POST /api/todos', () => {
  it('should create a new todo and cache it in Redis', async () => {
    const newTodo = {
      content: 'Test todo',
      isCompleted: false,
    };

    const response = await request(app)
      .post('/api/todos')
      .send(newTodo)
      .expect(201);

    expect(response.body.message).toBe('Todo created successfully!');
    expect(response.body.createdTodo).toMatchObject(newTodo);

    // Verify that the todo is cached in Redis
    const cachedTodo = await redisClient.get(
      `todo:${response.body.createdTodo._id}`
    );
    expect(cachedTodo).not.toBeNull(); // expect(cachedTodo).toBeTruthy();
    expect(JSON.parse(cachedTodo)).toMatchObject(newTodo);
  });

  // it('should not create a todo with invalid data', async () => {
  //   const invalidTodo = { content: '', isCompleted: false };

  //   const response = await request(app)
  //     .post('/api/todos')
  //     .send(invalidTodo)
  //     .expect('Content-Type', /json/)
  //     .expect(400);

  //   expect(response.body.message).toBe('Invalid todo data');
  // });
});
