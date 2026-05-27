import { Activity } from '../models/Activity.js';

export async function recordActivity(actor, type, message, refs = {}) {
  return Activity.create({ actor, type, message, ...refs });
}
