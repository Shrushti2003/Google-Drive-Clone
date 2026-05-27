import { connectDatabase } from '../config/db.js';
import { File } from '../models/File.js';
import { getDetailedFileType, getFileCategory, getFileExtension } from '../shared/constants/fileTypes.js';

await connectDatabase();

const files = await File.find({});
let updated = 0;

for (const file of files) {
  const extension = file.extension || getFileExtension(file.originalName || file.name);
  const fileType = getDetailedFileType(file.mimeType, file.originalName || file.name);
  const category = getFileCategory(file.mimeType, file.originalName || file.name);
  const tags = [category, fileType, extension.replace('.', ''), file.mimeType?.split('/')[0]].filter(Boolean);

  if (file.category !== category || file.fileType !== fileType || file.extension !== extension) {
    file.category = category;
    file.fileType = fileType;
    file.extension = extension;
    file.tags = [...new Set([...(file.tags || []), ...tags])];
    await file.save();
    updated += 1;
  }
}

console.log(`Repaired ${updated} file record${updated === 1 ? '' : 's'}`);
await import('mongoose').then(({ default: mongoose }) => mongoose.disconnect());
