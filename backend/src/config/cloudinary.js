import cloudinaryPackage from 'cloudinary';
import { env } from './env.js';

export const cloudinary = cloudinaryPackage.v2;
export const isCloudinaryConfigured = Boolean(
  env.cloudinary.cloudName &&
  env.cloudinary.apiKey &&
  env.cloudinary.apiSecret
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true
  });
}

export const cloudinaryStorageClient = cloudinaryPackage;
