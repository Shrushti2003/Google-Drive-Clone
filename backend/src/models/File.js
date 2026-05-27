import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null, index: true },
    name: { type: String, required: true, trim: true, maxlength: 180 },
    originalName: { type: String, required: true },
    extension: { type: String, index: true },
    mimeType: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    fileType: { type: String, index: true },
    tags: [{ type: String, index: true }],
    size: { type: Number, required: true, min: 0 },
    provider: { type: String, enum: ['cloudinary', 'local'], default: 'cloudinary' },
    providerId: { type: String, required: true },
    resourceType: { type: String, enum: ['image', 'video', 'raw'], default: 'raw' },
    url: { type: String, required: true },
    secureUrl: String,
    thumbnailUrl: String,
    checksum: String,
    starred: { type: Boolean, default: false },
    trashedAt: Date,
    shared: { type: Boolean, default: false },
    lastOpenedAt: Date
  },
  { timestamps: true }
);

fileSchema.index({ owner: 1, name: 'text', originalName: 'text', mimeType: 'text', category: 'text', tags: 'text' });
fileSchema.index({ owner: 1, folder: 1, trashedAt: 1, updatedAt: -1 });
fileSchema.index({ owner: 1, category: 1, trashedAt: 1, createdAt: -1 });

export const File = mongoose.model('File', fileSchema);
