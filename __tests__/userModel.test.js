import mongoose from 'mongoose';
import User from '../models/user-model.js';

describe('User Model Test', () => {
  it('should create & save user successfully', async () => {
    const validUser = new User({
      username: 'Test user',
      email: 'user@test.com',
      password: 'testPassword',
      role: 'user',
      isActive: true,
      profilePicture: 'https://i.imgur.com/73329f1.png',
      todos: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
    });
    const savedUser = await validUser.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.username).toBe('Test user');
    expect(savedUser.email).toBe('user@test.com');
    expect(savedUser.password).toBe('testPassword');
    expect(savedUser.role).toBe('user');
    expect(savedUser.isActive).toBe(true);
    expect(savedUser.profilePicture).toBe('https://i.imgur.com/73329f1.png');
    expect(savedUser.todos).toHaveLength(2);
  });

  it('should fail to save user with invalid data', async () => {
    const invalidUser = new User({
      username: '',
      email: 'user@test.com',
      password: 'testPassword',
      role: 'user',
      isActive: true,
      profilePicture: 'https://i.imgur.com/73329f1.png',
    });
    let err;
    try {
      await invalidUser.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  });

  it('should not allow duplicate email addresses', async () => {
    const user1 = new User({
      username: 'User1',
      email: 'duplicate@test.com',
      password: 'password123',
    });
    await user1.save();

    const user2 = new User({
      username: 'User2',
      email: 'duplicate@test.com',
      password: 'password456',
    });

    await expect(user2.save()).rejects.toThrow(mongoose.mongo.MongoServerError); //The Duplicate Key Error ( E11000 error) occurs when MongoDB attempts to enforce a unique index on a field, and a document with a duplicate key value is being inserted or updated.
  });

  it('should set default values correctly', async () => {
    const user = new User({
      username: 'DefaultUser',
      email: 'default@test.com',
      password: 'password123',
    });
    const savedUser = await user.save();

    expect(savedUser.role).toBe('user');
    expect(savedUser.isActive).toBe(true);
  });

  it('should require username, email, and password', async () => {
    const user = new User({});
    let err;
    try {
      await user.save();
    } catch (error) {
      err = error;
      console.log('Full error object:', JSON.stringify(err, null, 2));
      console.log('Username error:', err.errors.username);
      console.log('Email error:', err.errors.email);
      console.log('Password error:', err.errors.password);
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.username).toBeDefined();
    expect(err.errors.email).toBeDefined();
    expect(err.errors.password).toBeDefined();
  });
});
