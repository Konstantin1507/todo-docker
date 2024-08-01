import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import { redisClient } from '../db/redisClient.js';
import User from '../models/user-model.js';

describe('POST /api/todos', () => {
  let user;
  let token;

  beforeEach(async () => {
    user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
  });

  it('should create a new todo, associate it with user, and cache it in Redis', async () => {
    const newTodo = {
      content: 'Test todo',
      isCompleted: false,
    };

    const response = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send(newTodo)
      .expect(201);

    expect(response.body.message).toBe('Todo created successfully!');
    expect(response.body.createdTodo).toMatchObject(newTodo);
    expect(response.body.user).toMatchObject({
      _id: user._id.toString(),
      username: user.username,
    });
    //expect(response.body.user._id).toBe(user._id.toString());
    //expect(response.body.user.username).toBe(user.username);

    // Verify user's todos array is updated
    const updatedUser = await User.findById(user._id);
    console.log(updatedUser.todos);
    console.log(response.body);
    expect(updatedUser.todos.map((id) => id.toString())).toContainEqual(
      response.body.createdTodo._id
    );

    // Verify that the todo is cached in Redis
    const cachedTodo = await redisClient.get(
      `todo:${response.body.createdTodo._id}`
    );
    //expect(cachedTodo).not.toBeNull();
    // expect(cachedTodo).toBeTruthy();
    expect(cachedTodo).not.toBeNull();
    expect(JSON.parse(cachedTodo)).toMatchObject(newTodo);
  });

  // it('should return 422 with specific error message if content is empty', async () => {
  //   const invalidTodo = { content: '', isCompleted: false };
  //   const response = await request(app)
  //     .post('/api/todos')
  //     .set('Authorization', `Bearer ${token}`)
  //     .send(invalidTodo)
  //     .expect(422);

  //   expect(response.body.errors).toContainEqual({
  //     content: 'Content is required',
  //   });
  // });

  // it('should return 422 with specific error message if content is not a string', async () => {
  //   const invalidTodo = { content: 123, isCompleted: false };
  //   const response = await request(app)
  //     .post('/api/todos')
  //     .set('Authorization', `Bearer ${token}`)
  //     .send(invalidTodo)
  //     .expect(422);

  //   expect(response.body.errors).toContainEqual({
  //     content: 'Content must be a string',
  //   });
  // });

  // it('should return 422 with specific error message if content exceeds 100 characters', async () => {
  //   const invalidTodo = { content: 'a'.repeat(101), isCompleted: false };
  //   const response = await request(app)
  //     .post('/api/todos')
  //     .set('Authorization', `Bearer ${token}`)
  //     .send(invalidTodo)
  //     .expect(422);

  //   expect(response.body.errors).toContainEqual({
  //     content: 'Content must be at most 100 characters long',
  //   });
  // });

  // it('should return 422 with specific error message if isCompleted is missing', async () => {
  //   const invalidTodo = { content: 'Test todo' };
  //   const response = await request(app)
  //     .post('/api/todos')
  //     .set('Authorization', `Bearer ${token}`)
  //     .send(invalidTodo)
  //     .expect(422);

  //   expect(response.body.errors).toContainEqual({
  //     isCompleted: 'isCompleted is required',
  //   });
  // });

  // it('should return 422 with specific error message if isCompleted is not a boolean', async () => {
  //   const invalidTodo = {
  //     content: 'Test todo',
  //     isCompleted: 'not a boolean',
  //   };
  //   const response = await request(app)
  //     .post('/api/todos')
  //     .set('Authorization', `Bearer ${token}`)
  //     .send(invalidTodo)
  //     .expect(422);

  //   expect(response.body.errors).toContainEqual({
  //     isCompleted: 'isCompleted must be a boolean',
  //   });
  // });

  // it('should return 400 if user is not found', async () => {
  //   const fakeToken = jwt.sign(
  //     { userId: 'fakeUserId' },
  //     process.env.JWT_SECRET
  //   );

  //   const response = await request(app)
  //     .post('/api/todos')
  //     .set('Authorization', `Bearer ${fakeToken}`)
  //     .send({ content: 'Test todo', isCompleted: false })
  //     .expect(400);

  //   console.log('Response:', response.body);
  //   if (response.status !== 400) {
  //     console.error('Unexpected response:', response.body);
  //   }

  //   expect(response.body.message).toBe('User not found!');
  // });
});
