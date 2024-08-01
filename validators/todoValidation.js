import { body } from 'express-validator';
import mongoose from 'mongoose';

const todoCreateValidationRules = () => {
  return [
    body('content')
      .notEmpty()
      .withMessage('Content is required')
      .isString()
      .withMessage('Content must be a string')
      .isLength({ max: 100 })
      .withMessage('Content must be at most 100 characters long'),
    body('isCompleted')
      .notEmpty()
      .withMessage('isCompleted is required')
      .isBoolean()
      .withMessage('isCompleted must be a boolean'),
    // body('userId')
    //   .notEmpty()
    //   .withMessage('User ID is required')
    //   .isMongoId()
    //   .withMessage('Invalid User ID format'),
  ];
};

const todoUpdateValidationRules = () => {
  return [
    body('content')
      .escape()
      .optional()
      .isString()
      .withMessage('Content must be a string')
      .isLength({ max: 100 })
      .withMessage('Content must be at most 100 characters long'),
    body('isCompleted')
      .optional()
      .isBoolean()
      .withMessage('isCompleted must be a boolean'),
    // body('userId')
    //   .notEmpty()
    //   .withMessage('User ID is required')
    //   .isMongoId()
    //   .withMessage('Invalid User ID format'),
  ];
};

export { todoCreateValidationRules, todoUpdateValidationRules };
