// src/middleware/validate.middleware.js
import { ZodError } from 'zod';
import logger from '../utils/logger.js';

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      logger.warn('Validation failed: %o', err.errors);
      return res.status(400).json({ success: false, message: 'Invalid request data', details: err.errors });
    }
    next(err);
  }
};

export default validate;
