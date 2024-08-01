import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user-model.js';
import app from '../app.js';

describe('POST /auth/login', () => {
  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash('password123', 12);
    await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
    });
  });

  it('should login successfully with correct credentials', async () => {
    const response = await request(app).post('/auth/login').send({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('User logged in!');
    expect(response.body.userId).toBeDefined();
    expect(response.body.token).toBeDefined();

    const decodedToken = jwt.verify(
      response.body.token,
      process.env.JWT_SECRET
    );
    expect(decodedToken.userId).toBeDefined();
  });

  it('should not login with incorrect email', async () => {
    const response = await request(app).post('/auth/login').send({
      username: 'testuser',
      email: 'incorrectemail@example.com',
      password: 'password123',
    });
    expect(response.status).toBe(401);
    console.log(response.body);
    expect(response.body.message).toBe('User with this email does not exist.');
  });

  it('should not pass the validation with invalid email', async () => {
    const response = await request(app).post('/auth/login').send({
      username: 'testuser',
      email: 'invalidemail',
      password: 'password123',
    });
    expect(response.status).toBe(422);
    console.log(response.body);
    expect(response.body.message).toBe('Validation failed');
    expect(response.body.errors[0].email).toBe(
      'Please enter a valid email address'
    );
  });

  it('should not login with incorrect password', async () => {
    const response = await request(app).post('/auth/login').send({
      username: 'testuser',
      email: 'test@example.com',
      password: 'incorrectpassword',
    });
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Incorrect password.');
  });

  it('should not pass the validation with invalid password', async () => {
    const response = await request(app).post('/auth/login').send({
      username: 'testuser',
      email: 'test@example.com',
      password: 'pass',
    });
    expect(response.status).toBe(422);
    console.log(response.body);
    expect(response.body.message).toBe('Validation failed');
    expect(response.body.errors[0].password).toBe(
      'Password must be at least 6 characters long'
    );
  });
});
