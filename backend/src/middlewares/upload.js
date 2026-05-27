import multer from 'multer';
import { AppError } from '../utils/AppError.js';

const blockedExtensions = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.com',
  '.msi',
  '.scr',
  '.ps1',
  '.vbs',
  '.js',
  '.jar',
  '.sh'
]);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 250 * 1024 * 1024, files: 25 },
  fileFilter: (_req, file, cb) => {
    const lowerName = file.originalname.toLowerCase();
    const blocked = [...blockedExtensions].some((extension) => lowerName.endsWith(extension));
    if (blocked) {
      return cb(new AppError('This file type is blocked for security reasons.', 415));
    }
    cb(null, true);
  }
});
