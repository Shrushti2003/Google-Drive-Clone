import { nanoid } from 'nanoid';
import { z } from 'zod';
import { env } from '../config/env.js';
import { File } from '../models/File.js';
import { Folder } from '../models/Folder.js';
import { SharedLink } from '../models/SharedLink.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recordActivity } from '../services/activity.service.js';

export const createShareSchema = z.object({
  file: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  folder: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  visibility: z.enum(['public', 'private']).default('public'),
  expiresAt: z.string().datetime().nullable().optional(),
  downloadEnabled: z.boolean().default(true)
}).refine((data) => Boolean(data.file) !== Boolean(data.folder), 'Share exactly one file or folder');

export const createShare = asyncHandler(async (req, res) => {
  if (req.body.file) {
    const file = await File.findOneAndUpdate({ _id: req.body.file, owner: req.user.id }, { shared: true }, { new: true });
    if (!file) throw new AppError('File not found', 404);
  }
  if (req.body.folder) {
    const folder = await Folder.exists({ _id: req.body.folder, owner: req.user.id });
    if (!folder) throw new AppError('Folder not found', 404);
  }

  const link = await SharedLink.create({
    token: nanoid(24),
    owner: req.user.id,
    file: req.body.file,
    folder: req.body.folder,
    visibility: req.body.visibility,
    expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
    downloadEnabled: req.body.downloadEnabled
  });

  await recordActivity(req.user.id, 'share', 'Created a share link', { file: req.body.file, folder: req.body.folder });
  res.status(201).json({ link, url: `${env.clientUrl}/share/${link.token}` });
});

export const myShares = asyncHandler(async (req, res) => {
  const links = await SharedLink.find({ owner: req.user.id }).populate('file folder').sort('-createdAt');
  res.json({ links });
});

export const revokeShare = asyncHandler(async (req, res) => {
  const link = await SharedLink.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!link) throw new AppError('Share link not found', 404);
  res.status(204).end();
});

export const resolveShare = asyncHandler(async (req, res) => {
  const link = await SharedLink.findOne({ token: req.params.token }).populate('file folder owner', 'name email avatarUrl');
  if (!link) throw new AppError('Share link not found', 404);
  if (link.expiresAt && link.expiresAt < new Date()) throw new AppError('Share link has expired', 410);
  link.views += 1;
  await link.save();
  res.json({ link });
});
