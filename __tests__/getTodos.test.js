import request from 'supertest';
import app from '../app.js';
import mongoose from 'mongoose';
import Todo from '../models/todo-model.js';

describe('GET /api/todos', () => {
  let testTodos;

  beforeEach(async () => {
    // Create test todos
    testTodos = [
      { content: 'Test todo 1', isCompleted: false },
      { content: 'Test todo 2', isCompleted: true },
      { content: 'Test todo 3', isCompleted: false },
      { content: 'Test todo 4', isCompleted: true },
    ];
    await Todo.insertMany(testTodos);
  });

  it('should return all todos for the user', async () => {
    const response = await request(app)
      .get('/api/todos')
      // .set('userId', 'user1')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.totalTodos).toBe(4);
    expect(response.body.todos.length).toBe(3); // Default limit is 3
  });

  it('should return completed todos for the user', async () => {
    const response = await request(app)
      .get('/api/todos?type=completed')
      // .set('userId', 'user1')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.todos.length).toBe(2);
    expect(response.body.totalTodos).toBe(2);
    expect(response.body.todos.every((todo) => todo.isCompleted)).toBe(true);
  });

  it('should fetch only uncompleted todos', async () => {
    const response = await request(app)
      .get('/api/todos?type=uncompleted')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.todos.length).toBe(2);
    expect(response.body.totalTodos).toBe(2);
    response.body.todos.forEach((todo) => expect(todo.isCompleted).toBe(false));
  });

  it('should paginate todos', async () => {
    const response = await request(app)
      .get('/api/todos?page=1&limit=2')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.todos.length).toBe(2);
    expect(response.body.totalTodos).toBe(4);
    expect(response.body.totalPages).toBe(2);
    expect(response.body.currentPage).toBe(1);
  });
});
