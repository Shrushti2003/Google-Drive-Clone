export const BROWSER_PREVIEW_TYPES = new Set(['pdf', 'document']);

export function canRenderInline(file = {}) {
  const mimeType = String(file.mimeType || '').toLowerCase();
  const fileType = String(file.fileType || '').toLowerCase();
  return fileType === 'pdf' || mimeType === 'application/pdf' || mimeType.startsWith('text/');
}

export function isOfficeDocument(file = {}) {
  const mimeType = String(file.mimeType || '').toLowerCase();
  const extension = String(file.extension || '').toLowerCase();
  return [
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.ppt',
    '.pptx',
    '.odt',
    '.ods',
    '.odp'
  ].includes(extension) || mimeType.includes('word') || mimeType.includes('excel') || mimeType.includes('powerpoint') || mimeType.includes('officedocument');
}
