import express from 'express';

import errorHandler from '../middleware/errorHandler.js';
import signup from '../controllers/auth-controllers/signup.js';
import login from '../controllers/auth-controllers/login.js';
import {
  signupValidationRules,
  loginValidationRules,
} from '../validators/authValidation.js';
import validate from '../middleware/validate.js';

const router = express.Router();

router.post('/signup', signupValidationRules(), validate, errorHandler(signup));

router.post('/login', loginValidationRules(), validate, errorHandler(login));

export default router;
