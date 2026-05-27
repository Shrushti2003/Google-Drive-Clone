import Stripe from 'stripe';
import { env } from './env.js';

export const stripe = env.stripe.secretKey
  ? new Stripe(env.stripe.secretKey, { apiVersion: '2024-06-20' })
  : null;

export function stripePriceForPlan(plan) {
  if (plan === 'pro') return env.stripe.proPriceId;
  if (plan === 'business') return env.stripe.businessPriceId;
  return null;
}

export function isStripeReadyForPlan(plan) {
  return Boolean(stripe && stripePriceForPlan(plan));
}
