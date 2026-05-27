import mongoose from 'mongoose';

const sharedLinkSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    file: { type: mongoose.Schema.Types.ObjectId, ref: 'File', default: null },
    folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    expiresAt: Date,
    downloadEnabled: { type: Boolean, default: true },
    views: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const SharedLink = mongoose.model('SharedLink', sharedLinkSchema);
