import { z } from 'zod';
import { EXTENSION_CATEGORIES, FILE_CATEGORIES, FILES_TAB_CATEGORIES, getDetailedFileType, getFileCategory, getFileExtension, getSearchCategory, normalizeCategoryFilter, normalizeMimeType } from '../shared/constants/fileTypes.js';
import { File } from '../models/File.js';
import { Folder } from '../models/Folder.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recordActivity } from '../services/activity.service.js';
import { assertStorageAvailable, getStorageSummary } from '../services/quota.service.js';
import { storeFile } from '../services/storage.service.js';
import { cleanupExpiredTrash, permanentlyDeleteFile } from '../services/trash.service.js';

export const updateFileSchema = z.object({
  name: z.string().trim().min(1).max(180).optional(),
  folder: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(),
  starred: z.boolean().optional()
});

export const listFiles = asyncHandler(async (req, res) => {
  const { folder = null, q = '', type = '', sort = '-updatedAt', trash = 'false', starred = 'false' } = req.query;
  const cleanup = await cleanupExpiredTrash(req.user.id);
  if (cleanup.freedBytes) {
    await User.findByIdAndUpdate(req.user.id, { $inc: { storageUsed: -cleanup.freedBytes } });
  }
  const base = { owner: req.user.id };
  const andClauses = [];
  const folderFilter = folder && folder !== 'all' ? folder : null;
  base.trashedAt = trash === 'true' ? { $ne: null } : null;
  if (folder !== 'all') base.folder = folderFilter;
  const normalizedType = normalizeCategoryFilter(type);
  if (normalizedType) {
    andClauses.push(categoryFilterClause(normalizedType));
  }
  if (starred === 'true') base.starred = true;
  if (q) {
    const term = String(q).trim();
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    const searchCategory = getSearchCategory(term);
    const searchClauses = [
      { name: regex },
      { originalName: regex },
      { mimeType: regex },
      { extension: regex },
      { fileType: regex },
      { tags: regex }
    ];
    if (searchCategory === 'files') searchClauses.push({ category: { $in: FILES_TAB_CATEGORIES } });
    else if (searchCategory) searchClauses.push({ category: searchCategory });
    andClauses.push({ $or: searchClauses });
  }
  if (andClauses.length) base.$and = andClauses;

  let currentFolder = null;
  let breadcrumbs = [];
  if (folderFilter) {
    currentFolder = await Folder.findOne({ _id: folderFilter, owner: req.user.id, trashedAt: null });
    if (!currentFolder) throw new AppError('Folder not found', 404);
    if (currentFolder.path?.length) {
      const ancestors = await Folder.find({ _id: { $in: currentFolder.path }, owner: req.user.id });
      breadcrumbs = currentFolder.path
        .map((id) => ancestors.find((folder) => folder._id.equals(id)))
        .filter(Boolean);
    }
  }

  const files = await File.find(base).sort(sort).limit(150);
  const folders = trash === 'true' || q || normalizedType
    ? []
    : await Folder.find({ owner: req.user.id, parent: folderFilter, trashedAt: null }).sort('name').limit(150);

  if (process.env.NODE_ENV !== 'production') {
    console.log('[files:list]', {
      user: req.user.id,
      query: { folder, q, type, normalizedType, sort, trash, starred },
      mongoFilter: base,
      fileCount: files.length,
      folderCount: folders.length
    });
  }

  res.json({ files, folders, currentFolder, breadcrumbs, storage: await getStorageSummary(req.user) });
});

function categoryFilterClause(type) {
  if (type === 'image') {
    return {
      $or: [
        { category: 'image' },
        { fileType: 'image' },
        { mimeType: { $in: FILE_CATEGORIES.image } },
        { extension: { $in: EXTENSION_CATEGORIES.image } }
      ]
    };
  }

  if (type === 'video') {
    return {
      $or: [
        { category: 'video' },
        { fileType: 'video' },
        { mimeType: { $in: FILE_CATEGORIES.video } },
        { extension: { $in: EXTENSION_CATEGORIES.video } }
      ]
    };
  }

  if (type === 'files' || type === 'file') {
    return {
      $or: [
        { category: { $in: FILES_TAB_CATEGORIES } },
        { fileType: { $in: FILES_TAB_CATEGORIES } },
        { category: { $nin: ['image', 'video'] }, fileType: { $exists: false } }
      ]
    };
  }

  return {
    $or: [
      { category: type },
      { fileType: type }
    ]
  };
}

export const uploadFiles = asyncHandler(async (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];
  if (!files.length) throw new AppError('No files were attached to the upload request.', 400);

  const incoming = files.reduce((sum, file) => sum + (file.size || file.bytes || 0), 0);
  await assertStorageAvailable(req.user, incoming);

  if (req.body.folder) {
    const folder = await Folder.exists({ _id: req.body.folder, owner: req.user.id, trashedAt: null });
    if (!folder) throw new AppError('Folder not found', 404);
  }

  const created = [];
  for (const file of files) {
    file.mimetype = normalizeMimeType(file.mimetype, file.originalname);
    const stored = await storeFile(file, req.user.id);
    const category = getFileCategory(file.mimetype, file.originalname);
    const fileType = getDetailedFileType(file.mimetype, file.originalname);
    const extension = getFileExtension(file.originalname);
    const doc = await File.create({
      owner: req.user.id,
      folder: req.body.folder || null,
      name: req.body.name || file.originalname,
      originalName: file.originalname,
      extension,
      mimeType: file.mimetype,
      category,
      fileType,
      tags: [category, fileType, extension.replace('.', ''), file.mimetype.split('/')[0]].filter(Boolean),
      size: file.size || file.bytes || 0,
      ...stored
    });
    if (process.env.NODE_ENV !== 'production') {
      console.log('[files:upload]', {
        originalName: file.originalname,
        mimeType: file.mimetype,
        extension,
        category,
        fileType,
        savedId: doc.id,
        provider: doc.provider,
        resourceType: doc.resourceType,
        url: doc.secureUrl || doc.url
      });
    }
    created.push(doc);
  }

  await User.findByIdAndUpdate(req.user.id, { $inc: { storageUsed: incoming } });
  await recordActivity(req.user.id, 'upload', `Uploaded ${created.length} file${created.length === 1 ? '' : 's'}`);
  res.status(201).json({ files: created, storage: await getStorageSummary(req.user) });
});

export const updateFile = asyncHandler(async (req, res) => {
  const file = await File.findOne({ _id: req.params.id, owner: req.user.id });
  if (!file) throw new AppError('File not found', 404);
  if (req.body.folder) {
    const folder = await Folder.exists({ _id: req.body.folder, owner: req.user.id, trashedAt: null });
    if (!folder) throw new AppError('Destination folder not found', 404);
  }
  Object.assign(file, req.body);
  await file.save();
  await recordActivity(req.user.id, req.body.folder !== undefined ? 'move' : 'rename', `Updated "${file.name}"`, { file: file.id });
  res.json({ file });
});

export const copyFile = asyncHandler(async (req, res) => {
  const file = await File.findOne({ _id: req.params.id, owner: req.user.id, trashedAt: null });
  if (!file) throw new AppError('File not found', 404);
  await assertStorageAvailable(req.user, file.size);
  const copy = await File.create({
    owner: req.user.id,
    folder: file.folder,
    name: `${file.name} copy`,
    originalName: file.originalName,
    mimeType: file.mimeType,
    category: file.category,
    fileType: file.fileType,
    extension: file.extension,
    tags: file.tags,
    size: file.size,
    provider: file.provider,
    providerId: file.providerId,
    resourceType: file.resourceType,
    url: file.url,
    secureUrl: file.secureUrl
  });
  await User.findByIdAndUpdate(req.user.id, { $inc: { storageUsed: file.size } });
  await recordActivity(req.user.id, 'copy', `Copied "${file.name}"`, { file: copy.id });
  res.status(201).json({ file: copy });
});

export const trashFile = asyncHandler(async (req, res) => {
  const file = await File.findOneAndUpdate({ _id: req.params.id, owner: req.user.id }, { trashedAt: new Date() }, { new: true });
  if (!file) throw new AppError('File not found', 404);
  await recordActivity(req.user.id, 'trash', `Moved "${file.name}" to trash`, { file: file.id });
  res.json({ file });
});

export const restoreFile = asyncHandler(async (req, res) => {
  const file = await File.findOneAndUpdate({ _id: req.params.id, owner: req.user.id }, { $unset: { trashedAt: 1 } }, { new: true });
  if (!file) throw new AppError('File not found', 404);
  await recordActivity(req.user.id, 'restore', `Restored "${file.name}"`, { file: file.id });
  res.json({ file });
});

export const deleteFile = asyncHandler(async (req, res) => {
  const file = await File.findOne({ _id: req.params.id, owner: req.user.id });
  if (!file) throw new AppError('File not found', 404);
  const freedBytes = await permanentlyDeleteFile(file);
  await User.findByIdAndUpdate(req.user.id, { $inc: { storageUsed: -freedBytes } });
  await recordActivity(req.user.id, 'delete', `Deleted "${file.name}" permanently`);
  res.status(204).end();
});

export const downloadFile = asyncHandler(async (req, res) => {
  const file = await File.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id, trashedAt: null },
    { lastOpenedAt: new Date() },
    { new: true }
  );
  if (!file) throw new AppError('File not found', 404);
  res.json({ url: file.secureUrl || file.url, name: file.name, mimeType: file.mimeType });
});

export const previewFile = asyncHandler(async (req, res) => {
  const file = await File.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id, trashedAt: null },
    { lastOpenedAt: new Date() },
    { new: true }
  );
  if (!file) throw new AppError('File not found', 404);

  const sourceUrl = file.secureUrl || file.url;
  if (!sourceUrl) throw new AppError('Preview URL is not available for this file.', 404);

  const upstream = await fetch(sourceUrl);
  if (!upstream.ok || !upstream.body) {
    throw new AppError('Could not load the stored file preview.', 502);
  }

  res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.name)}"`);
  res.setHeader('Cache-Control', 'private, max-age=300');
  if (upstream.headers.get('content-length')) {
    res.setHeader('Content-Length', upstream.headers.get('content-length'));
  }

  const reader = upstream.body.getReader();
  async function pump() {
    const { done, value } = await reader.read();
    if (done) return res.end();
    res.write(Buffer.from(value));
    return pump();
  }
  await pump();
});
