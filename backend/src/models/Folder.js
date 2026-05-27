import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null, index: true },
    path: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Folder' }],
    color: { type: String, default: '#3B82F6' },
    starred: { type: Boolean, default: false },
    trashedAt: Date
  },
  { timestamps: true }
);

folderSchema.index({ owner: 1, parent: 1, name: 1, trashedAt: 1 });

export const Folder = mongoose.model('Folder', folderSchema);
