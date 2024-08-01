import { validationResult } from 'express-validator';

const validate = (req, res, next) => {
  const errors = validationResult(req);
  console.log(errors);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = errors
    .array()
    .map((err) => ({ [err.path]: err.msg }));

  console.log('Validation errors:', extractedErrors);

  const error = new Error('Validation failed');
  error.statusCode = 422;
  error.data = extractedErrors;
  next(error);
};

export default validate;
