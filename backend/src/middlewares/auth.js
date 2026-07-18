import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/tokens.js';

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError('Authentication required', 401);

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    throw new AppError('Invalid or expired access token', 401, {
      type: error.name,
      code: error.code
    });
  }
  const user = await User.findById(payload.sub);
  if (!user) throw new AppError('User no longer exists', 401);

  req.user = user;
  next();
});

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') return next(new AppError('Admin access required', 403));
  next();
}
