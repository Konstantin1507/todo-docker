import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import User from '../../models/user-model.js';

const login = async (req, res) => {
  const { email, password } = req.body;
  const loggedUser = await User.findOne({ email });
  if (!loggedUser) {
    const error = new Error('User with this email does not exist.');
    error.statusCode = 401;
    throw error;
  }
  const isPasswordCorrect = await bcrypt.compare(password, loggedUser.password);
  if (!isPasswordCorrect) {
    const error = new Error('Incorrect password.');
    error.statusCode = 401;
    throw error;
  }
  const token = jwt.sign(
    { userId: loggedUser._id.toString() },
    process.env.JWT_SECRET,
    {
      expiresIn: '1h',
    }
  );
  res.status(200).json({
    message: 'User logged in!',
    userId: loggedUser._id,
    token,
  });
};

export default login;
