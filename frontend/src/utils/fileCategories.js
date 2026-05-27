const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif', 'heic', 'heif']);
const videoExtensions = new Set(['mp4', 'm4v', 'mov', 'webm', 'mkv', 'avi', 'wmv', 'mpeg', 'mpg']);

function extensionFromFile(file = {}) {
  const explicit = String(file.extension || '').replace(/^\./, '').toLowerCase();
  if (explicit) return explicit;
  const source = String(file.originalName || file.name || '');
  return source.includes('.') ? source.split('.').pop().toLowerCase() : '';
}

export function getDriveCategory(file = {}) {
  const category = String(file.category || '').toLowerCase();
  const fileType = String(file.fileType || '').toLowerCase();
  const mimeType = String(file.mimeType || '').toLowerCase();
  const extension = extensionFromFile(file);

  if (category === 'image' || fileType === 'image' || mimeType.startsWith('image/') || imageExtensions.has(extension)) {
    return 'image';
  }

  if (category === 'video' || fileType === 'video' || mimeType.startsWith('video/') || videoExtensions.has(extension)) {
    return 'video';
  }

  return 'file';
}

export function matchesDriveSection(file, section) {
  if (!section) return true;
  if (section === 'files' || section === 'file') return getDriveCategory(file) === 'file';
  return getDriveCategory(file) === section;
}
