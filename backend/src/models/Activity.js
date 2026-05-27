import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['upload', 'rename', 'move', 'copy', 'trash', 'restore', 'delete', 'share', 'billing', 'login'],
      required: true
    },
    file: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
    folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
    message: { type: String, required: true }
  },
  { timestamps: true }
);

activitySchema.index({ actor: 1, createdAt: -1 });

export const Activity = mongoose.model('Activity', activitySchema);
