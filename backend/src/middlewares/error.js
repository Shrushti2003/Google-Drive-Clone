import { AppError } from '../utils/AppError.js';

export function notFound(req, _res, next) {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
}

export function errorHandler(error, _req, res, _next) {
  console.error('========== BACKEND ERROR ==========');
  console.error(error);
  console.error(error.stack);
  console.error(error.message);
  console.error(error.code);
  console.error(error.type);
  console.error(error.details);
  console.error('===================================');

  const statusCode = error.statusCode || 500;
  const payload = {
    message: error.message,
    type: error.type,
    code: error.code,
    details: error.details
  };

  if (process.env.NODE_ENV !== 'production') {
    payload.stack = error.stack;
  }

  res.status(statusCode).json(payload);
}
