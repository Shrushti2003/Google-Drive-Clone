import { Router } from 'express';
import { z } from 'zod';
import { billingPortal, checkout, getSubscription, stripeHealth, syncCheckoutSession, webhook } from '../controllers/stripe.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../utils/validators.js';

const router = Router();

console.log('Loaded stripe routes');
router.post('/webhook', webhook);
router.get('/stripe-health', stripeHealth);
router.use(requireAuth);
router.get('/subscription', getSubscription);
router.post('/checkout', validate(z.object({ plan: z.enum(['pro', 'business']) })), checkout);
router.post('/checkout/sync', validate(z.object({ sessionId: z.string().min(3) })), syncCheckoutSession);
router.post('/portal', billingPortal);

export default router;
