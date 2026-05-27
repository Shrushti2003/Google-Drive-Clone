import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp();

const health = await request(app).get('/health').expect(200);
if (health.body.status !== 'ok') {
  throw new Error('Health endpoint failed');
}

const missing = await request(app).get('/api/files').expect(401);
if (!missing.body.message) {
  throw new Error('Protected route did not return a useful error');
}

console.log('Server smoke checks passed');
