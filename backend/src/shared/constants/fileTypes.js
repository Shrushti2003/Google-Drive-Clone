import path from 'node:path';
import mime from 'mime-types';

export const FILE_CATEGORIES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif', 'image/heic', 'image/heif'],
  video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/x-msvideo', 'video/x-ms-wmv', 'video/mpeg'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'audio/flac', 'audio/aac'],
  pdf: ['application/pdf'],
  document: [
    'text/plain',
    'text/csv',
    'application/rtf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation'
  ],
  archive: [
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/vnd.rar',
    'application/x-7z-compressed',
    'application/gzip',
    'application/x-tar'
  ]
};

export const EXTENSION_CATEGORIES = {
  image: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif', '.heic', '.heif'],
  video: ['.mp4', '.m4v', '.mov', '.webm', '.mkv', '.avi', '.wmv', '.mpeg', '.mpg'],
  audio: ['.mp3', '.m4a', '.aac', '.wav', '.webm', '.ogg', '.flac'],
  pdf: ['.pdf'],
  document: ['.txt', '.csv', '.rtf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp', '.md'],
  archive: ['.zip', '.rar', '.7z', '.gz', '.tar']
};

export const CATEGORY_ALIASES = {
  all: '',
  images: 'image',
  image: 'image',
  photos: 'image',
  photo: 'image',
  videos: 'video',
  video: 'video',
  movies: 'video',
  audio: 'file',
  music: 'file',
  pdf: 'file',
  pdfs: 'file',
  documents: 'file',
  document: 'file',
  docs: 'file',
  file: 'file',
  files: 'files',
  zip: 'file',
  zips: 'file',
  archive: 'file',
  archives: 'file',
  other: 'file'
};

export const FILES_TAB_CATEGORIES = ['file', 'audio', 'pdf', 'document', 'archive', 'other'];

export function getFileExtension(filename = '') {
  return path.extname(filename).toLowerCase();
}

export function getDetailedFileType(mimeType = '', filename = '') {
  const extension = getFileExtension(filename);
  const inferredMime = extension ? mime.lookup(extension) : false;
  const normalizedMime = String(mimeType || inferredMime || '').toLowerCase();
  const mimeMatch = Object.entries(FILE_CATEGORIES).find(([, types]) => types.includes(normalizedMime));
  if (mimeMatch) return mimeMatch[0];

  const extensionMatch = Object.entries(EXTENSION_CATEGORIES).find(([, extensions]) => extensions.includes(extension));
  return extensionMatch?.[0] || 'other';
}

export function normalizeMimeType(mimeType = '', filename = '') {
  const extension = getFileExtension(filename);
  const inferredMime = extension ? mime.lookup(extension) : false;
  const normalizedMime = String(mimeType || '').toLowerCase();
  if (!normalizedMime || normalizedMime === 'application/octet-stream') {
    return inferredMime || normalizedMime || 'application/octet-stream';
  }
  return normalizedMime;
}

export function getFileCategory(mimeType = '', filename = '') {
  const detailedType = getDetailedFileType(mimeType, filename);
  if (detailedType === 'image') return 'image';
  if (detailedType === 'video') return 'video';
  return 'file';
}

export function normalizeCategoryFilter(value = '') {
  return CATEGORY_ALIASES[String(value).trim().toLowerCase()] ?? value;
}

export function getSearchCategory(value = '') {
  return CATEGORY_ALIASES[String(value).trim().toLowerCase()] || null;
}
