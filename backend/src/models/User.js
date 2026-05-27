import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { STORAGE_PLANS } from '../shared/constants/plans.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: {
      type: String,
      required() {
        return this.authProvider !== 'google';
      },
      select: false
    },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String, unique: true, sparse: true, index: true },
    avatarUrl: String,
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    plan: { type: String, enum: Object.keys(STORAGE_PLANS), default: 'starter' },
    storageUsed: { type: Number, default: 0, min: 0 },
    emailVerified: { type: Boolean, default: false },
    verificationTokenHash: String,
    resetPasswordTokenHash: String,
    resetPasswordExpiresAt: Date,
    refreshTokenHash: { type: String, select: false },
    tokenVersion: { type: Number, default: 0 },
    stripeCustomerId: String,
    preferences: {
      theme: { type: String, enum: ['system', 'light', 'dark'], default: 'system' },
      viewMode: { type: String, enum: ['grid', 'list'], default: 'grid' }
    }
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.pre('validate', function normalizeLegacyPlan(next) {
  if (this.plan === 'free') this.plan = 'starter';
  next();
});

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this.id,
    name: this.name,
    email: this.email,
    avatarUrl: this.avatarUrl,
    role: this.role,
    plan: this.plan,
    storageUsed: this.storageUsed,
    emailVerified: this.emailVerified,
    authProvider: this.authProvider,
    preferences: this.preferences,
    createdAt: this.createdAt
  };
};

export const User = mongoose.model('User', userSchema);
