import { env } from './env.js';

const developmentOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173'
]);

export function corsOrigin(origin, callback) {
  if (!origin) return callback(null, true);
  if (origin === env.clientUrl || (env.nodeEnv !== 'production' && developmentOrigins.has(origin))) {
    return callback(null, true);
  }
  return callback(new Error(`CORS blocked origin: ${origin}`));
}
