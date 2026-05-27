import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDir = path.dirname(fileURLToPath(import.meta.url));

function loadEnvFile(filePath, { override = false } = {}) {
  if (!fs.existsSync(filePath)) return;
  const parsed = dotenv.parse(fs.readFileSync(filePath));
  for (const [key, value] of Object.entries(parsed)) {
    if (!value) continue;
    if (override || !process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.resolve(configDir, '../../../.env'));
loadEnvFile(path.resolve(configDir, '../../.env'), { override: true });

const requiredInProduction = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'COOKIE_SECRET',
  'CLIENT_URL',
  'SERVER_URL'
];

if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI && !process.env.MONGO_URI) {
  throw new Error('Missing required environment variable: MONGODB_URI');
}

for (const key of requiredInProduction) {
  if (process.env.NODE_ENV === 'production' && !process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 8080),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  serverUrl: process.env.SERVER_URL || 'http://localhost:8080',
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cloudnest-drive',
  mongoFallbackUri: process.env.MONGODB_FALLBACK_URI,
  mongoServerSelectionTimeoutMs: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000),
  databaseRequired: process.env.DATABASE_REQUIRED === 'true' || process.env.NODE_ENV === 'production',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '30d',
  cookieSecret: process.env.COOKIE_SECRET || 'dev-cookie-secret-change-me',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_OAUTH_CALLBACK_URL || `${process.env.SERVER_URL || 'http://localhost:8080'}/api/auth/google/callback`
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'cloudnest',
    directUpload: process.env.CLOUDINARY_DIRECT_UPLOAD === 'true',
    required: process.env.CLOUDINARY_REQUIRED === 'true' || process.env.NODE_ENV === 'production'
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    proPriceId: process.env.STRIPE_PRO_PRICE_ID,
    businessPriceId: process.env.STRIPE_BUSINESS_PRICE_ID
  }
};
