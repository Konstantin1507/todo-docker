import bcrypt from 'bcryptjs';

import User from '../../models/user-model.js';

const signup = async (req, res) => {
  const { username, email, password, role, isActive, profilePicture } =
    req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('User with this email already exists.');
    error.statusCode = 401;
    throw error;
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  // console.log(hashedPassword);

  const newUser = new User({
    username,
    email,
    password: hashedPassword,
    role: role || 'user',
    isActive: isActive !== undefined ? isActive : true,
    profilePicture: profilePicture || undefined,
  });
  await newUser.save();
  res.status(201).json({ message: 'User created!', userId: newUser._id });
};

export default signup;
