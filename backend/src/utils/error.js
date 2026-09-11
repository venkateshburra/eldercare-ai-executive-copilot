// src/utils/error.js

export class AppError extends Error {
  constructor(message, statusCode = 500, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error factories
export const notFound = (resource = 'Resource') =>
  new AppError(`${resource} not found`, 404, `${resource.toUpperCase().replace(/ /g, '_')}_NOT_FOUND`);

export const badRequest = (message, details = null) =>
  new AppError(message, 400, 'BAD_REQUEST', details);

export const unauthorized = (message = 'Authentication required') =>
  new AppError(message, 401, 'UNAUTHORIZED');

export const forbidden = (message = 'Permission denied') =>
  new AppError(message, 403, 'FORBIDDEN');

export const conflict = (message) =>
  new AppError(message, 409, 'CONFLICT');

export const tooManyRequests = (message = 'Too many requests') =>
  new AppError(message, 429, 'RATE_LIMIT_EXCEEDED');
