import { databaseStatus, isDatabaseConnected } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

const allowedWithoutDatabase = new Set([
  'GET /auth/google',
  'GET /auth/google/status'
]);

export function requireDatabase(req, _res, next) {
  const routeKey = `${req.method} ${req.path}`;
  if (allowedWithoutDatabase.has(routeKey)) return next();
  if (isDatabaseConnected()) return next();

  const protectedPrefixes = ['/files', '/folders', '/dashboard', '/billing', '/shares'];
  if (!req.headers.authorization && protectedPrefixes.some((prefix) => req.path.startsWith(prefix))) {
    return next();
  }

  return next(new AppError('Database is not connected. Google login cannot persist the user session until MongoDB is reachable.', 503, {
    database: databaseStatus()
  }));
}
