// src/middleware/errorHandler.middleware.js
import { AppError } from '../utils/error.js';
import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  // If already sent headers, delegate to default express handler
  if (res.headersSent) return next(err);

  const isOperational = err instanceof AppError && err.isOperational;
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = isOperational ? err.message : 'Internal server error';

  logger.error(`${req.method} ${req.originalUrl} → ${statusCode} ${message}`, err.stack || '');

  const response = { success: false, message, code };

  if (process.env.NODE_ENV !== 'production' && !isOperational) {
    response.details = err.message;
    response.stack = err.stack;
  } else if (err.details) {
    response.details = err.details;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
