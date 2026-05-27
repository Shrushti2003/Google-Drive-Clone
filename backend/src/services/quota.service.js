import { STORAGE_PLANS } from '../shared/constants/plans.js';
import { File } from '../models/File.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export async function calculateStorageUsed(userId) {
  const [usage] = await File.aggregate([
    { $match: { owner: userId } },
    { $group: { _id: null, used: { $sum: '$size' } } }
  ]);
  return usage?.used || 0;
}

export async function syncStorageUsed(user) {
  const used = await calculateStorageUsed(user._id);
  user.storageUsed = used;
  await User.updateOne({ _id: user._id }, { storageUsed: used });
  return used;
}

export async function assertStorageAvailable(user, incomingBytes) {
  const used = await syncStorageUsed(user);
  const limit = STORAGE_PLANS[user.plan]?.storageBytes || STORAGE_PLANS.starter.storageBytes;
  if (used + incomingBytes > limit) {
    throw new AppError('Storage limit exceeded. Upgrade your plan to continue uploading.', 402, {
      used,
      incoming: incomingBytes,
      limit,
      plan: user.plan
    });
  }
}

export function storageSummary(user) {
  const plan = STORAGE_PLANS[user.plan] || STORAGE_PLANS.starter;
  return {
    used: user.storageUsed || 0,
    limit: plan.storageBytes,
    plan: plan.key,
    percent: Math.min(100, Math.round(((user.storageUsed || 0) / plan.storageBytes) * 100))
  };
}

export async function getStorageSummary(user) {
  await syncStorageUsed(user);
  return storageSummary(user);
}
