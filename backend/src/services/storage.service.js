import { nanoid } from 'nanoid';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { env } from '../config/env.js';
import { getDetailedFileType } from '../shared/constants/fileTypes.js';

function localStoredFile(file) {
  const id = `local-${nanoid(16)}`;
  const resourceType = cloudinaryResourceType(file);
  return {
    provider: 'local',
    providerId: id,
    resourceType,
    url: `https://placehold.co/1200x800?text=${encodeURIComponent(file.originalname)}`,
    secureUrl: `https://placehold.co/1200x800?text=${encodeURIComponent(file.originalname)}`,
    thumbnailUrl: `https://placehold.co/480x320?text=${encodeURIComponent(file.originalname)}`
  };
}

function cloudinaryResourceType(file) {
  const detailedType = getDetailedFileType(file.mimetype, file.originalname);
  if (detailedType === 'image') return 'image';
  if (detailedType === 'video' || detailedType === 'audio') return 'video';
  return 'raw';
}

function uploadToCloudinary(file, folder) {
  const resourceType = cloudinaryResourceType(file);
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: `${Date.now()}-${nanoid(8)}`,
        use_filename: false,
        unique_filename: true
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          provider: 'cloudinary',
          providerId: result.public_id,
          resourceType: result.resource_type,
          url: result.secure_url,
          secureUrl: result.secure_url,
          thumbnailUrl: result.resource_type === 'image'
            ? cloudinary.url(result.public_id, { width: 480, height: 320, crop: 'fill', gravity: 'auto', secure: true })
            : result.secure_url
        });
      }
    );
    stream.end(file.buffer);
  });
}

export async function storeFile(file, userId) {
  const directCloudinaryUrl = file.secure_url || file.url || file.path;
  const directCloudinaryId = file.public_id || file.filename || file.file_id;

  if (directCloudinaryUrl && directCloudinaryId) {
    return {
      provider: 'cloudinary',
      providerId: directCloudinaryId,
      resourceType: file.resource_type || cloudinaryResourceType(file),
      url: directCloudinaryUrl,
      secureUrl: directCloudinaryUrl,
      thumbnailUrl: file.resource_type === 'image'
        ? cloudinary.url(directCloudinaryId, { width: 480, height: 320, crop: 'fill', gravity: 'auto', secure: true })
        : directCloudinaryUrl
    };
  }

  if (isCloudinaryConfigured && file.buffer) {
    try {
      return await uploadToCloudinary(file, `${env.cloudinary.folder}/${userId}`);
    } catch (error) {
      if (env.cloudinary.required) throw error;
      return localStoredFile(file);
    }
  }

  return localStoredFile(file);
}

export async function deleteStoredFile(file) {
  if (file.provider === 'cloudinary' && isCloudinaryConfigured) {
    const resourceType = file.resourceType || (file.fileType === 'video' || file.fileType === 'audio' ? 'video' : file.fileType === 'image' ? 'image' : 'raw');
    await cloudinary.uploader.destroy(file.providerId, { resource_type: resourceType });
  }
}
