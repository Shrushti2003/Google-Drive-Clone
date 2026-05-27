import { createApp } from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { startTrashCleanupJob } from './services/trash.service.js';

const app = createApp();

try {
  await connectDatabase();
  console.log('MongoDB connected');
  startTrashCleanupJob();
} catch (error) {
  console.error('MongoDB connection failed:', {
    code: error.code,
    message: error.message,
    hostname: error.hostname
  });

  if (env.databaseRequired) {
    console.error('DATABASE_REQUIRED is enabled, so the API will stop.');
    process.exit(1);
  }

  console.warn('Starting API without MongoDB for diagnostics. Auth and storage routes will return 503 until MongoDB is reachable.');
}

const server = app.listen(env.port, () => {
  console.log(`CloudNest API listening on ${env.serverUrl}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${env.port} is already in use. Run "npm run free-port" or close the other backend terminal, then restart.`);
    process.exit(1);
  }
  console.error('Server failed to start:', error);
  process.exit(1);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down CloudNest API`);
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
