import Stripe from 'stripe';
import { env } from './env.js';

export const stripeApiVersion = '2024-06-20';

if (!env.stripe.secretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

export const stripe = new Stripe(env.stripe.secretKey, { apiVersion: stripeApiVersion });

export function stripePriceForPlan(plan) {
  if (plan === 'pro') return env.stripe.proPriceId;
  if (plan === 'business') return env.stripe.businessPriceId;
  return null;
}

export function isStripeReadyForPlan(plan) {
  return Boolean(stripe && stripePriceForPlan(plan));
}
