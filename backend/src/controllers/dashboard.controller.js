import { STORAGE_PLANS } from '../shared/constants/plans.js';
import { Activity } from '../models/Activity.js';
import { File } from '../models/File.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getStorageSummary } from '../services/quota.service.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const [recentFiles, activities, categoryUsage] = await Promise.all([
    File.find({ owner: req.user.id, trashedAt: null }).sort('-updatedAt').limit(8),
    Activity.find({ actor: req.user.id }).sort('-createdAt').limit(12),
    File.aggregate([
      { $match: { owner: req.user._id, trashedAt: null } },
      { $group: { _id: '$category', bytes: { $sum: '$size' }, count: { $sum: 1 } } },
      { $sort: { bytes: -1 } }
    ])
  ]);

  res.json({
    recentFiles,
    activities,
    categoryUsage,
    storage: await getStorageSummary(req.user),
    plan: STORAGE_PLANS[req.user.plan]
  });
});

export const adminOverview = asyncHandler(async (_req, res) => {
  const [users, files, revenuePlans, storage] = await Promise.all([
    User.countDocuments(),
    File.countDocuments({ trashedAt: null }),
    User.aggregate([{ $group: { _id: '$plan', count: { $sum: 1 } } }]),
    User.aggregate([{ $group: { _id: null, used: { $sum: '$storageUsed' } } }])
  ]);

  res.json({
    users,
    files,
    revenuePlans,
    storageUsed: storage[0]?.used || 0
  });
});

export const adminUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().sort('-createdAt').limit(100);
  res.json({ users: users.map((user) => user.toSafeJSON()) });
});
