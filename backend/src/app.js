import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import { env } from './config/env.js';
import { corsOrigin } from './config/cors.js';
import { requireDatabase } from './middlewares/database.js';
import { errorHandler, notFound } from './middlewares/error.js';
import { apiLimiter } from './middlewares/rateLimit.js';
import routes from './routes/index.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: corsOrigin, credentials: true }));
  app.use(compression());
  app.use(cookieParser(env.cookieSecret));
  app.use(['/api/billing/webhook', '/api/stripe/webhook'], express.raw({ type: 'application/json' }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(mongoSanitize());
  app.use(hpp());
  app.use(apiLimiter);

  if (env.nodeEnv !== 'test') app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'cloudnest-api', timestamp: new Date().toISOString() });
  });

  console.log('Complete middleware order:', [
    'helmet',
    'cors',
    'compression',
    'cookieParser',
    'express.raw /api/billing/webhook,/api/stripe/webhook',
    'express.json',
    'express.urlencoded',
    'mongoSanitize',
    'hpp',
    'apiLimiter',
    env.nodeEnv !== 'test' ? 'morgan' : 'morgan skipped in test',
    'GET /health',
    'app.use /api -> requireDatabase -> routes',
    'notFound',
    'errorHandler'
  ]);

  app.use('/api', requireDatabase, routes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
