import { env } from './env.js';

const developmentOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173'
]);

function normalizeOrigin(origin) {
  return origin?.replace(/\/+$/, '');
}

export function corsOrigin(origin, callback) {
  if (!origin) return callback(null, true);
  const normalizedOrigin = normalizeOrigin(origin);
  const configuredClientOrigin = normalizeOrigin(env.clientUrl);
  if (
    normalizedOrigin === configuredClientOrigin ||
    (env.nodeEnv !== 'production' && developmentOrigins.has(normalizedOrigin))
  ) {
    return callback(null, true);
  }
  return callback(new Error(`CORS blocked origin: ${origin}`));
}
