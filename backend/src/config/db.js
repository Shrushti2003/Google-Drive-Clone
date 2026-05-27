import mongoose from 'mongoose';
import { env } from './env.js';

export const databaseState = {
  connected: false,
  lastError: null,
  activeUriLabel: null
};

function redactMongoUri(uri) {
  return uri.replace(/mongodb(\+srv)?:\/\/([^@]+)@/, 'mongodb$1://<credentials>@');
}

export async function connectDatabase() {
  mongoose.set('strictQuery', true);
  mongoose.set('bufferCommands', false);

  const candidates = [env.mongoUri];
  if (env.mongoFallbackUri && env.mongoFallbackUri !== env.mongoUri) {
    candidates.push(env.mongoFallbackUri);
  }

  let lastError;
  for (const uri of candidates) {
    try {
      await mongoose.connect(uri, {
        autoIndex: env.nodeEnv !== 'production',
        serverSelectionTimeoutMS: env.mongoServerSelectionTimeoutMs
      });
      databaseState.connected = true;
      databaseState.lastError = null;
      databaseState.activeUriLabel = redactMongoUri(uri);
      return mongoose.connection;
    } catch (error) {
      lastError = error;
      databaseState.connected = false;
      databaseState.lastError = {
        code: error.code,
        message: error.message,
        hostname: error.hostname
      };
      await mongoose.disconnect().catch(() => {});
    }
  }

  throw lastError;
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

export function databaseStatus() {
  return {
    connected: isDatabaseConnected(),
    readyState: mongoose.connection.readyState,
    activeUri: databaseState.activeUriLabel,
    lastError: databaseState.lastError
  };
}

export function describeMongoTarget() {
  const clean = env.mongoUri.replace(/mongodb(\+srv)?:\/\/([^@]+)@?/, '');
  return {
    scheme: env.mongoUri.startsWith('mongodb+srv://') ? 'mongodb+srv' : 'mongodb',
    host: clean.split('/')[0],
    fallbackConfigured: Boolean(env.mongoFallbackUri)
  };
}
