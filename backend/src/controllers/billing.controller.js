import { FREE_PLAN_KEY, STORAGE_PLANS } from '../shared/constants/plans.js';
import { env } from '../config/env.js';
import { stripe, stripePriceForPlan } from '../config/stripe.js';
import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const billingPortal = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ user: req.user.id });
  if (!stripe || !subscription?.stripeCustomerId) {
    throw new AppError('Billing portal is only available after a Stripe subscription is created.', 409);
  }
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${env.clientUrl}/app`
  });
  res.json({ url: session.url });
});

export const checkout = asyncHandler(async (req, res) => {
  const { plan } = req.body;
  if (!['pro', 'business'].includes(plan)) throw new AppError('Invalid subscription plan', 422);

  if (!stripe || !stripePriceForPlan(plan)) {
    throw new AppError('Stripe checkout is not configured for this plan. Verify STRIPE_SECRET_KEY and the plan price ID.', 503);
  }

  let customerId = req.user.stripeCustomerId;
  let session;
  try {
    if (!customerId) {
      const customer = await stripe.customers.create({ email: req.user.email, name: req.user.name, metadata: { userId: req.user.id } });
      customerId = customer.id;
      await User.findByIdAndUpdate(req.user.id, { stripeCustomerId: customerId });
    }

console.log("========== STRIPE ENV ==========");
console.log("Secret Key Exists:", !!env.stripe.secretKey);
console.log(
  "Secret Key Prefix:",
  env.stripe.secretKey?.substring(0, 12)
);
console.log("Pro Price:", stripePriceForPlan("pro"));
console.log("Business Price:", stripePriceForPlan("business"));
console.log("===============================");

    session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: req.user.id,
      line_items: [{ price: stripePriceForPlan(plan), quantity: 1 }],
      success_url: `${env.clientUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.clientUrl}/billing/cancel?plan=${plan}`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: { address: 'auto', name: 'auto' },
      metadata: { userId: req.user.id, plan },
      subscription_data: {
        metadata: { userId: req.user.id, plan }
      }
    });
  } catch (error) {
     console.log("========== STRIPE DEBUG ==========");
    console.error("Full Error:", error);
    console.error("Type:", error?.type);
    console.error("Message:", error?.message);
    console.error("Code:", error?.code);
    console.error("Raw:", error?.raw);
    console.error("Stack:", error?.stack);
    console.log("=================================");

    throw toStripeCheckoutError(error);
  }

  res.json({ url: session.url });
});

export const getSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ user: req.user.id });
  res.json({ subscription: subscription || { plan: FREE_PLAN_KEY, status: 'free', invoices: [] }, plans: STORAGE_PLANS });
});

export const syncCheckoutSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) throw new AppError('Stripe checkout session ID is required', 422);
  if (!stripe) throw new AppError('Stripe is not configured', 503);

  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] });
  const belongsToUser = session.metadata?.userId === req.user.id || session.client_reference_id === req.user.id;
  if (!belongsToUser) throw new AppError('Checkout session does not belong to this user', 403);
  if (session.mode !== 'subscription' || session.status !== 'complete') {
    throw new AppError('Checkout session has not completed yet', 409);
  }

  await handleCheckoutCompleted(session);
  const subscription = await Subscription.findOne({ user: req.user.id });
  const user = await User.findById(req.user.id);
  res.json({ subscription, user: user.toSafeJSON() });
});

export const webhook = asyncHandler(async (req, res) => {
  if (!stripe || !env.stripe.webhookSecret) return res.status(204).end();
  const signature = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, signature, env.stripe.webhookSecret);

  if (event.type === 'checkout.session.completed') {
    await handleCheckoutCompleted(event.data.object);
  }

  if (event.type === 'customer.subscription.deleted') {
    await handleSubscriptionDeleted(event.data.object);
  }

  if (event.type === 'invoice.payment_succeeded') {
    await handleInvoicePaid(event.data.object);
  }

  res.json({ received: true });
});

async function handleCheckoutCompleted(session) {
  const plan = session.metadata?.plan;
  const userId = session.metadata?.userId;
  if (!['pro', 'business'].includes(plan) || !userId) return;

  const stripeSubscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id;
  let periodEnd;
  if (stripeSubscriptionId && stripe) {
    const subscription = typeof session.subscription === 'object'
      ? session.subscription
      : await stripe.subscriptions.retrieve(stripeSubscriptionId);
    periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined;
  }

  await Subscription.findOneAndUpdate(
    { user: userId },
    {
      plan,
      status: 'active',
      stripeCustomerId: session.customer,
      stripeSubscriptionId,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false
    },
    { upsert: true, new: true }
  );
  await User.findByIdAndUpdate(userId, { plan, stripeCustomerId: session.customer });
}

async function handleSubscriptionDeleted(subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  await Subscription.findOneAndUpdate(
    { user: userId },
    {
      plan: FREE_PLAN_KEY,
      status: 'cancelled',
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined,
      cancelAtPeriodEnd: false
    },
    { upsert: true }
  );
  await User.findByIdAndUpdate(userId, { plan: FREE_PLAN_KEY });
}

async function handleInvoicePaid(invoice) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  const subscription = await Subscription.findOne({ stripeSubscriptionId: subscriptionId });
  if (!subscription) return;

  subscription.status = 'active';
  subscription.invoices.unshift({
    stripeInvoiceId: invoice.id,
    amountPaid: invoice.amount_paid,
    currency: invoice.currency,
    hostedInvoiceUrl: invoice.hosted_invoice_url,
    paidAt: new Date()
  });
  subscription.invoices = subscription.invoices.slice(0, 12);
  await subscription.save();
}

function toStripeCheckoutError(error) {
  if (error?.type === 'StripeAuthenticationError') {
    return new AppError('Stripe rejected the secret key. Verify STRIPE_SECRET_KEY is a valid test-mode key.', 503);
  }
  if (error?.type === 'StripeInvalidRequestError') {
    return new AppError('Stripe rejected the checkout request. Verify the selected plan uses a valid recurring Stripe price ID.', 503, {
      stripeType: error.type,
      stripeCode: error.code
    });
  }
  if (error?.type?.startsWith('Stripe')) {
    return new AppError('Stripe checkout could not be opened right now. Please try again after confirming Stripe test mode is available.', 502, {
      stripeType: error.type,
      stripeCode: error.code
    });
  }
  return error;
}
