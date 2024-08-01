import request from 'supertest';
import bcrypt from 'bcryptjs';
import User from '../models/user-model.js';
import app from '../app.js';

describe('POST /auth/signup', () => {
  it('should create a new user', async () => {
    const newUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };
    const response = await request(app)
      .post('/auth/signup')
      .send(newUser)
      .expect(201);

    expect(response.body.message).toBe('User created!');
    expect(response.body.userId).toBeDefined();

    const user = await User.findOne({ email: newUser.email });
    expect(user).toBeTruthy();
    expect(user.username).toBe(newUser.username);
    expect(await bcrypt.compare(newUser.password, user.password)).toBe(true);
  });

  it('should not create a user with an existing email', async () => {
    await User.create({
      username: 'existinguser',
      email: 'existing@example.com',
      password: 'password123',
    });

    const response = await request(app)
      .post('/auth/signup')
      .send({
        username: 'newuser',
        email: 'existing@example.com',
        password: 'newpassword',
      })
      .expect(401);

    expect(response.body.message).toBe('User with this email already exists.');
  });

  it('should not create a user with an invalid email', async () => {
    const response = await request(app)
      .post('/auth/signup')
      .send({
        username: 'newuser',
        email: 'invalid',
        password: 'password123',
      })
      .expect(422);

    console.log('Response body:', response.body);
    expect(response.body.message).toBe('Validation failed');
    expect(response.body.errors[0].email).toBe(
      'Please enter a valid email address'
    );
  });

  it('should not create a user with an invalid password', async () => {
    const response = await request(app)
      .post('/auth/signup')
      .send({
        username: 'newuser',
        email: 'test@example.com',
        password: '1',
      })
      .expect(422);

    console.log('Response body:', response.body);
    expect(response.body.message).toBe('Validation failed');
    expect(response.body.errors[0].password).toBe(
      'Password must be at least 6 characters long'
    );
  });

  it('should set default values for optional fields', async () => {
    const response = await request(app)
      .post('/auth/signup')
      .send({
        username: 'newuser',
        email: 'test@example.com',
        password: 'password',
      })
      .expect(201);

    expect(response.body.message).toBe('User created!');

    const user = await User.findOne({ email: 'test@example.com' });
    expect(response.body.userId).toBeDefined();
    expect(user.role).toBe('user');
    expect(user.isActive).toBe(true);
    expect(user.profilePicture).toBeUndefined();
  });
});
