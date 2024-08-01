import request from 'supertest';
import app from '../app.js';
import mongoose from 'mongoose';
import Todo from '../models/todo-model.js';
import User from '../models/user-model.js';
import jwt from 'jsonwebtoken';

describe('GET /api/todos', () => {
  let testTodos;
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

    testTodos = [
      { content: 'Test todo 1', isCompleted: false, userId: user._id },
      { content: 'Test todo 2', isCompleted: true, userId: user._id },
      { content: 'Test todo 3', isCompleted: false, userId: user._id },
      { content: 'Test todo 4', isCompleted: true, userId: user._id },
    ];
    await Todo.insertMany(testTodos);

    user.todos = testTodos.map((todo) => todo._id);
    await user.save();
  });

  it('should return all todos for the user', async () => {
    const response = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.totalTodos).toBe(4);
    expect(response.body.todos.length).toBe(3); // Default limit is 3
  });

  it('should return completed todos for the user', async () => {
    const response = await request(app)
      .get('/api/todos?type=completed')
      .set('Authorization', `Bearer ${token}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.todos.length).toBe(2);
    expect(response.body.totalTodos).toBe(2);
    expect(response.body.todos.every((todo) => todo.isCompleted)).toBe(true);
  });

  it('should fetch only uncompleted todos', async () => {
    const response = await request(app)
      .get('/api/todos?type=uncompleted')
      .set('Authorization', `Bearer ${token}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.todos.length).toBe(2);
    expect(response.body.totalTodos).toBe(2);
    response.body.todos.forEach((todo) => expect(todo.isCompleted).toBe(false));
  });

  it('should paginate todos', async () => {
    const response = await request(app)
      .get('/api/todos?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.todos.length).toBe(2);
    expect(response.body.totalTodos).toBe(4);
    expect(response.body.totalPages).toBe(2);
    expect(response.body.currentPage).toBe(1);
  });

  it('should allow admin to fetch all todos', async () => {
    const response = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.totalTodos).toBe(4);
    expect(response.body.todos.length).toBe(3); // Default limit is 3
  });
});
