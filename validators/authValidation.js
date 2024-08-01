import { body } from 'express-validator';

const signupValidationRules = () => {
  return [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required')
      .isString()
      .withMessage('Content must be a string')
      .isLength({ max: 10 })
      .withMessage('Content must be at most 10 characters long'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please enter a valid email address')
      .normalizeEmail(),
    body('password')
      .trim()
      .notEmpty()
      .withMessage('Password is required')
      .isString()
      .withMessage('Password must be a string')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('role')
      .optional()
      .isString()
      .withMessage('Role must be a string')
      .isIn(['user', 'admin'])
      .withMessage('Invalid role'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    body('profilePicture')
      .optional()
      .isURL()
      .withMessage('profilePicture must be a valid URL'),
  ];
};

const loginValidationRules = () => {
  return [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please enter a valid email address')
      .normalizeEmail(),
    body('password')
      .trim()
      .notEmpty()
      .withMessage('Password is required')
      .isString()
      .withMessage('Password must be a string')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ];
};

export { signupValidationRules, loginValidationRules };
