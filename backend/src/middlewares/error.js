import { AppError } from '../utils/AppError.js';

export function notFound(req, _res, next) {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
}

export function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;
  const payload = {
    message: error.isOperational ? error.message : 'Something went wrong',
    details: error.details
  };

  if (process.env.NODE_ENV !== 'production') {
    payload.stack = error.stack;
  }

  res.status(statusCode).json(payload);
}
