import { z } from 'zod';
import { AppError } from './AppError.js';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      return next(new AppError('Validation failed', 422, parsed.error.flatten()));
    }
    req[source] = parsed.data;
    next();
  };
}
