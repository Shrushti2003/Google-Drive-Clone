import { z } from 'zod';
import { File } from '../models/File.js';
import { Folder } from '../models/Folder.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recordActivity } from '../services/activity.service.js';
import { cleanupExpiredTrash, permanentlyDeleteFile } from '../services/trash.service.js';

export const createFolderSchema = z.object({
  name: z.string().trim().min(1).max(120),
  parent: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional()
});

export const updateFolderSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  parent: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  starred: z.boolean().optional()
});

export const listFolders = asyncHandler(async (req, res) => {
  const cleanup = await cleanupExpiredTrash(req.user.id);
  if (cleanup.freedBytes) {
    await User.findByIdAndUpdate(req.user.id, { $inc: { storageUsed: -cleanup.freedBytes } });
  }
  const folders = await Folder.find({
    owner: req.user.id,
    trashedAt: req.query.trash === 'true' ? { $ne: null } : null
  }).sort('path name');
  res.json({ folders });
});

export const createFolder = asyncHandler(async (req, res) => {
  const parent = req.body.parent ? await Folder.findOne({ _id: req.body.parent, owner: req.user.id, trashedAt: null }) : null;
  if (req.body.parent && !parent) throw new AppError('Parent folder not found', 404);

  const folder = await Folder.create({
    owner: req.user.id,
    name: req.body.name,
    parent: req.body.parent || null,
    color: req.body.color,
    path: parent ? [...parent.path, parent.id] : []
  });
  await recordActivity(req.user.id, 'move', `Created folder "${folder.name}"`, { folder: folder.id });
  res.status(201).json({ folder });
});

export const updateFolder = asyncHandler(async (req, res) => {
  const folder = await Folder.findOne({ _id: req.params.id, owner: req.user.id });
  if (!folder) throw new AppError('Folder not found', 404);
  Object.assign(folder, req.body);
  await folder.save();
  await recordActivity(req.user.id, 'rename', `Updated folder "${folder.name}"`, { folder: folder.id });
  res.json({ folder });
});

export const trashFolder = asyncHandler(async (req, res) => {
  const now = new Date();
  const folder = await Folder.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id },
    { trashedAt: now },
    { new: true }
  );
  if (!folder) throw new AppError('Folder not found', 404);
  const descendantFolders = await Folder.find({ owner: req.user.id, path: folder._id }).select('_id');
  const folderIds = [folder._id, ...descendantFolders.map((item) => item._id)];
  await Folder.updateMany({ owner: req.user.id, _id: { $in: folderIds } }, { trashedAt: now });
  await File.updateMany({ owner: req.user.id, folder: { $in: folderIds } }, { trashedAt: now });
  await recordActivity(req.user.id, 'trash', `Moved folder "${folder.name}" to trash`, { folder: folder.id });
  res.json({ folder });
});

export const restoreFolder = asyncHandler(async (req, res) => {
  const folder = await Folder.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id },
    { $unset: { trashedAt: 1 } },
    { new: true }
  );
  if (!folder) throw new AppError('Folder not found', 404);
  const descendantFolders = await Folder.find({ owner: req.user.id, path: folder._id }).select('_id');
  const folderIds = [folder._id, ...descendantFolders.map((item) => item._id)];
  await Folder.updateMany({ owner: req.user.id, _id: { $in: folderIds } }, { $unset: { trashedAt: 1 } });
  await File.updateMany({ owner: req.user.id, folder: { $in: folderIds } }, { $unset: { trashedAt: 1 } });
  await recordActivity(req.user.id, 'restore', `Restored folder "${folder.name}"`, { folder: folder.id });
  res.json({ folder });
});

export const deleteFolder = asyncHandler(async (req, res) => {
  const folder = await Folder.findOne({ _id: req.params.id, owner: req.user.id });
  if (!folder) throw new AppError('Folder not found', 404);

  const descendantFolders = await Folder.find({ owner: req.user.id, path: folder._id }).select('_id');
  const folderIds = [folder._id, ...descendantFolders.map((item) => item._id)];
  const files = await File.find({ owner: req.user.id, folder: { $in: folderIds } });
  let freedBytes = 0;

  for (const file of files) {
    freedBytes += await permanentlyDeleteFile(file);
  }

  await Folder.deleteMany({ owner: req.user.id, _id: { $in: folderIds } });
  if (freedBytes) await User.findByIdAndUpdate(req.user.id, { $inc: { storageUsed: -freedBytes } });
  await recordActivity(req.user.id, 'delete', `Deleted folder "${folder.name}" permanently`, { folder: folder.id });
  res.status(204).end();
});
