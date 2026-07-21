import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDir = path.dirname(fileURLToPath(import.meta.url));
const initialNodeEnv = process.env.NODE_ENV || 'development';
const shouldOverrideLocalEnv = initialNodeEnv !== 'production';
const developmentClientUrl = 'http://localhost:5173';
const developmentServerUrl = 'http://localhost:8080';

function loadEnvFile(filePath, { override = false } = {}) {
  if (!fs.existsSync(filePath)) return;
  const parsed = dotenv.parse(fs.readFileSync(filePath));
  for (const [key, value] of Object.entries(parsed)) {
    if (!value) continue;
    if (override || !process.env[key]) process.env[key] = value;
  }
}

if (shouldOverrideLocalEnv) {
  loadEnvFile(path.resolve(configDir, '../../../.env'));
  loadEnvFile(path.resolve(configDir, '../../.env'), { override: true });
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

function normalizeUrl(value) {
  return value?.replace(/\/+$/, '');
}

function isLocalUrl(value) {
  try {
    const parsed = new URL(value);
    return ['localhost', '127.0.0.1'].includes(parsed.hostname);
  } catch {
    return false;
  }
}

function requireProductionUrl(name, value) {
  const normalizedValue = normalizeUrl(value);
  if (!isProduction) return normalizedValue;

  if (!normalizedValue) {
    console.warn(`Missing required production environment variable: ${name}`);
    throw new Error(`Missing required production environment variable: ${name}`);
  }

  if (isLocalUrl(normalizedValue)) {
    throw new Error(`Invalid production environment variable: ${name} must not point to localhost or 127.0.0.1`);
  }

  return normalizedValue;
}

const configuredClientUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || process.env.APP_URL || process.env.VITE_APP_URL;
const configuredServerUrl = process.env.SERVER_URL;
const clientUrl = requireProductionUrl('FRONTEND_URL', configuredClientUrl) || developmentClientUrl;
const serverUrl = requireProductionUrl('SERVER_URL', configuredServerUrl) || developmentServerUrl;

function resolveGoogleCallbackUrl() {
  const callbackUrl = normalizeUrl(process.env.GOOGLE_OAUTH_CALLBACK_URL);

  if (!callbackUrl) {
    if (isProduction) {
      console.warn('GOOGLE_OAUTH_CALLBACK_URL is not set; deriving it from SERVER_URL.');
    }
    return `${serverUrl}/api/auth/google/callback`;
  }

  if (isProduction && isLocalUrl(callbackUrl)) {
    throw new Error('Invalid production environment variable: GOOGLE_OAUTH_CALLBACK_URL must not point to localhost or 127.0.0.1');
  }

  return callbackUrl;
}

const googleCallbackUrl = resolveGoogleCallbackUrl();

const requiredInProduction = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'COOKIE_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

if (isProduction && !process.env.MONGODB_URI && !process.env.MONGO_URI) {
  console.warn('Missing required production environment variable: MONGODB_URI');
  throw new Error('Missing required environment variable: MONGODB_URI');
}

for (const key of requiredInProduction) {
  if (isProduction && !process.env[key]) {
    console.warn(`Missing required production environment variable: ${key}`);
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT || 8080),
  clientUrl,
  serverUrl,
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cloudnest-drive',
  mongoFallbackUri: process.env.MONGODB_FALLBACK_URI,
  mongoServerSelectionTimeoutMs: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000),
  databaseRequired: process.env.DATABASE_REQUIRED === 'true' || isProduction,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '30d',
  cookieSecret: process.env.COOKIE_SECRET || 'dev-cookie-secret-change-me',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: googleCallbackUrl
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'cloudnest',
    directUpload: process.env.CLOUDINARY_DIRECT_UPLOAD === 'true',
    required: process.env.CLOUDINARY_REQUIRED === 'true' || isProduction
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    proPriceId: process.env.STRIPE_PRICE_PRO,
    businessPriceId: process.env.STRIPE_PRICE_BUSINESS,
    accountDisplayName: process.env.STRIPE_ACCOUNT_DISPLAY_NAME || 'CloudNest',
    expectedAccountId: process.env.STRIPE_EXPECTED_ACCOUNT_ID
  }
};
