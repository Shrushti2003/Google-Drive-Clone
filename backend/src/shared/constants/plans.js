export const STORAGE_PLANS = {
  starter: {
    key: 'starter',
    name: 'Starter',
    storageBytes: 20 * 1024 ** 3,
    monthlyPrice: 0,
    currency: 'INR',
    stripePriceEnv: null,
    highlights: ['20 GB secure storage', 'Core file previews', 'Folder management']
  },
  pro: {
    key: 'pro',
    name: 'CloudNest Pro',
    storageBytes: 80 * 1024 ** 3,
    monthlyPrice: 149,
    currency: 'INR',
    stripePriceEnv: 'STRIPE_PRO_PRICE_ID',
    highlights: ['80 GB storage', 'Advanced sharing controls', 'Priority upload queue']
  },
  business: {
    key: 'business',
    name: 'CloudNest Business',
    storageBytes: 200 * 1024 ** 3,
    monthlyPrice: 350,
    currency: 'INR',
    stripePriceEnv: 'STRIPE_BUSINESS_PRICE_ID',
    highlights: ['200 GB workspace storage', 'Admin analytics', 'Team-ready controls']
  }
};

export const FREE_PLAN_KEY = 'starter';
export const PLAN_ORDER = ['starter', 'pro', 'business'];
