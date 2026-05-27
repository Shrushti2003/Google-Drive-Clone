import request from 'supertest';
import { createApp } from '../app.js';
import { connectDatabase } from '../config/db.js';
import { Activity } from '../models/Activity.js';
import { File } from '../models/File.js';
import { Folder } from '../models/Folder.js';
import { SharedLink } from '../models/SharedLink.js';
import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';

const app = createApp();
const email = `integration-${Date.now()}@cloudnest.test`;

try {
  await connectDatabase();

  const register = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Integration Tester', email, password: 'StrongPass123!' })
    .expect(201);

  const token = register.body.accessToken;
  const auth = { Authorization: `Bearer ${token}` };

  await request(app).get('/api/auth/me').set(auth).expect(200);

  const folder = await request(app)
    .post('/api/folders')
    .set(auth)
    .send({ name: 'Launch assets' })
    .expect(201);

  const upload = await request(app)
    .post('/api/files/upload')
    .set(auth)
    .field('folder', folder.body.folder._id)
    .attach('files', Buffer.from('CloudNest integration fixture'), {
      filename: 'roadmap.txt',
      contentType: 'text/plain'
    })
    .expect(201);

  const file = upload.body.files[0];
  if (file.category !== 'file' || file.fileType !== 'document') {
    throw new Error(`Expected document upload to be stored as file/document, received ${file.category}/${file.fileType}`);
  }

  await request(app).get('/api/files?q=roadmap&type=files').set(auth).expect(200);

  const imageUpload = await request(app)
    .post('/api/files/upload')
    .set(auth)
    .attach('files', Buffer.from('fake image bytes'), {
      filename: 'aurora.JPG',
      contentType: 'application/octet-stream'
    })
    .expect(201);
  const imageFile = imageUpload.body.files[0];
  if (imageFile.category !== 'image' || imageFile.extension !== '.jpg') {
    throw new Error(`Expected extension-based image classification, received ${imageFile.category}/${imageFile.extension}`);
  }
  await request(app).get('/api/files?type=image&q=aur').set(auth).expect(200);

  const mixedUpload = await request(app)
    .post('/api/files/upload')
    .set(auth)
    .attach('files', Buffer.from('%PDF-1.4 fake pdf fixture'), {
      filename: 'contract.pdf',
      contentType: 'application/pdf'
    })
    .attach('files', Buffer.from('fake mp4 bytes'), {
      filename: 'demo.mp4',
      contentType: 'video/mp4'
    })
    .attach('files', Buffer.from('fake zip bytes'), {
      filename: 'archive.zip',
      contentType: 'application/octet-stream'
    })
    .expect(201);

  const uploadedTypes = mixedUpload.body.files.map((item) => `${item.name}:${item.category}/${item.fileType}`).sort();
  if (!uploadedTypes.includes('archive.zip:file/archive') || !uploadedTypes.includes('contract.pdf:file/pdf') || !uploadedTypes.includes('demo.mp4:video/video')) {
    throw new Error(`Expected PDF, video, and ZIP uploads to classify correctly, received ${uploadedTypes.join(', ')}`);
  }

  await request(app).patch(`/api/files/${file._id}`).set(auth).send({ starred: true, name: 'roadmap-final.txt' }).expect(200);
  await request(app).post(`/api/files/${file._id}/copy`).set(auth).expect(201);
  await request(app).get(`/api/files/${file._id}/download`).set(auth).expect(200);

  const share = await request(app)
    .post('/api/shares')
    .set(auth)
    .send({ file: file._id, visibility: 'public', downloadEnabled: true })
    .expect(201);

  await request(app).get(`/api/shares/public/${share.body.link.token}`).expect(200);
  const checkout = await request(app).post('/api/billing/checkout').set(auth).send({ plan: 'pro' });
  if (![200, 502, 503].includes(checkout.status)) {
    throw new Error(`Expected checkout to return a Stripe URL or setup error, received ${checkout.status}`);
  }
  await request(app).get('/api/billing/subscription').set(auth).expect(200);
  await request(app).post(`/api/files/${file._id}/trash`).set(auth).expect(200);
  await request(app).post(`/api/files/${file._id}/restore`).set(auth).expect(200);
  for (const uploaded of mixedUpload.body.files) {
    await request(app).delete(`/api/files/${uploaded._id}`).set(auth).expect(204);
  }
  await request(app).delete(`/api/files/${imageFile._id}`).set(auth).expect(204);
  await request(app).delete(`/api/files/${file._id}`).set(auth).expect(204);

  console.log('Integration checks passed');
} catch (error) {
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    console.error('Integration checks could not reach MongoDB. Verify MONGODB_URI, Atlas IP access, and DNS/network connectivity.');
  }
  throw error;
} finally {
  const user = await User.findOne({ email });
  if (user) {
    await Promise.all([
      File.deleteMany({ owner: user._id }),
      Folder.deleteMany({ owner: user._id }),
      SharedLink.deleteMany({ owner: user._id }),
      Activity.deleteMany({ actor: user._id }),
      Subscription.deleteMany({ user: user._id }),
      User.deleteOne({ _id: user._id })
    ]);
  }
  await import('mongoose').then(({ default: mongoose }) => mongoose.disconnect());
}
