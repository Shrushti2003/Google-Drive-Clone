import { File } from '../models/File.js';
import { Folder } from '../models/Folder.js';
import { User } from '../models/User.js';
import { deleteStoredFile } from './storage.service.js';

export const TRASH_RETENTION_DAYS = 30;
export const TRASH_RETENTION_MS = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export function trashExpiresAt(trashedAt) {
  if (!trashedAt) return null;
  return new Date(new Date(trashedAt).getTime() + TRASH_RETENTION_MS);
}

export function remainingTrashDays(trashedAt) {
  if (!trashedAt) return TRASH_RETENTION_DAYS;
  const remaining = trashExpiresAt(trashedAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}

export async function permanentlyDeleteFile(file) {
  await deleteStoredFile(file);
  await file.deleteOne();
  return file.size || 0;
}

export async function cleanupExpiredTrash(owner) {
  const cutoff = new Date(Date.now() - TRASH_RETENTION_MS);
  const expiredFiles = await File.find({ owner, trashedAt: { $lte: cutoff } });
  const expiredFolders = await Folder.find({ owner, trashedAt: { $lte: cutoff } }).select('_id');
  let freedBytes = 0;

  for (const file of expiredFiles) {
    freedBytes += await permanentlyDeleteFile(file);
  }

  if (expiredFolders.length) {
    await Folder.deleteMany({ owner, _id: { $in: expiredFolders.map((folder) => folder._id) } });
  }

  return { deletedFiles: expiredFiles.length, deletedFolders: expiredFolders.length, freedBytes };
}

export async function cleanupAllExpiredTrash() {
  const cutoff = new Date(Date.now() - TRASH_RETENTION_MS);
  const ownerIds = await File.distinct('owner', { trashedAt: { $lte: cutoff } });
  const folderOwnerIds = await Folder.distinct('owner', { trashedAt: { $lte: cutoff } });
  const owners = [...new Set([...ownerIds, ...folderOwnerIds].map((id) => String(id)))];

  for (const owner of owners) {
    const result = await cleanupExpiredTrash(owner);
    if (result.freedBytes) {
      await User.findByIdAndUpdate(owner, { $inc: { storageUsed: -result.freedBytes } });
    }
  }

  return owners.length;
}

export function startTrashCleanupJob(intervalMs = 6 * 60 * 60 * 1000) {
  const run = () => cleanupAllExpiredTrash().catch((error) => {
    console.error('Trash cleanup failed:', error.message);
  });
  const timer = setInterval(run, intervalMs);
  timer.unref?.();
  run();
  return timer;
}
