import { FREE_PLAN_KEY, STORAGE_PLANS } from '../shared/constants/plans.js';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';
import { stripe, stripeApiVersion, stripePriceForPlan } from '../config/stripe.js';
import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const CHECKOUT_MODE = 'subscription';
const __filename = fileURLToPath(import.meta.url);

export const stripeHealth = asyncHandler(async (_req, res) => {
  try {
    await stripe.balance.retrieve();
    const branding = await getStripeAccountBranding();
    res.json({ connected: true, branding });
  } catch (error) {
    res.status(error.statusCode || error.status || 502).json({
      connected: false,
      type: error.type,
      code: error.code,
      message: error.message,
      stack: error.stack
    });
  }
});

export const billingPortal = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ user: req.user.id });
  if (!stripe || !subscription) {
    throw new AppError('Billing portal is only available after a Stripe subscription is created.', 409);
  }
  const customerId = await resolveStripeCustomer(req.user, subscription, 'billing_portal');
  const returnUrl = buildClientUrl('/app', 'return_url');
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl
  });
  debugBilling('billing portal session created', {
    authenticatedUserId: req.user.id,
    mongoUserId: req.user._id?.toString?.() || req.user.id,
    stripeCustomerId: customerId,
    sessionId: session.id
  });
  res.json({ url: session.url });
});

export const checkout = asyncHandler(async (req, res) => {
  console.log('RUNNING FILE:', __filename);
  const { plan } = req.body;
  if (!['pro', 'business'].includes(plan)) throw new AppError('Invalid subscription plan', 422);

  const priceId = stripePriceForPlan(plan);
  if (!priceId) {
    throw new AppError('Stripe checkout is not configured for this plan. Verify STRIPE_PRICE_PRO and STRIPE_PRICE_BUSINESS.', 503);
  }

  const successUrl = buildClientUrl('/billing/success?session_id={CHECKOUT_SESSION_ID}', 'success_url');
  const cancelUrl = buildClientUrl(`/billing/cancel?plan=${plan}`, 'cancel_url');

  const subscription = await Subscription.findOne({ user: req.user.id });
  const customerId = await resolveStripeCustomer(req.user, subscription, 'checkout');
  let session;
  try {
    const metadata = { userId: req.user.id, plan };
    await ensureStripeAccountBranding();
    const checkoutParams = {
      mode: CHECKOUT_MODE,
      customer: customerId,
      client_reference_id: req.user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: { address: 'auto', name: 'auto' },
      metadata,
      subscription_data: { metadata }
    };

    logCheckoutRequest({ checkoutParams, customerEmail: req.user.email });
    console.log('\n========== STRIPE CHECKOUT PARAMS ==========');
    console.dir(checkoutParams, { depth: null });
    console.log('============================================\n');
    console.log('mode:', checkoutParams.mode);
    console.log('line_items:', checkoutParams.line_items);
    console.log('price:', checkoutParams.line_items?.[0]?.price);
    console.log('subscription_data:', checkoutParams.subscription_data);
    console.log('customer:', checkoutParams.customer);
    console.log('customer_email:', checkoutParams.customer_email);
    console.log('success_url:', checkoutParams.success_url);
    console.log('cancel_url:', checkoutParams.cancel_url);
    await logStripeRuntimeDiagnostics(priceId, checkoutParams);
    try {
      session = await stripe.checkout.sessions.create(checkoutParams);
    } catch (err) {
      console.error('========= STRIPE ERROR =========');
      console.error('type:', err.type);
      console.error('code:', err.code);
      console.error('param:', err.param);
      console.error('message:', err.message);
      console.error('raw:', err.raw);
      console.error('stack:', err.stack);
      console.error('===============================');
      throw err;
    }
    debugBilling('checkout session created', {
      authenticatedUserId: req.user.id,
      mongoUserId: req.user._id?.toString?.() || req.user.id,
      stripeCustomerId: customerId,
      sessionId: session.id
    });
  } catch (error) {
    const stripeError = serializeStripeError(error);
    console.error('========== STRIPE CHECKOUT ERROR ==========');
    console.error(stripeError);
    console.error('===========================================');

    throw error;
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
  if (session.mode !== CHECKOUT_MODE || session.status !== 'complete') {
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

  if (event.type === 'customer.subscription.created') {
    await handleSubscriptionCreated(event.data.object);
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

  const stripeCustomerId = getStripeId(session.customer);

  await Subscription.findOneAndUpdate(
    { user: userId },
    {
      plan,
      status: 'active',
      stripeCustomerId,
      stripeSubscriptionId,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false
    },
    { upsert: true, new: true }
  );
  await User.findByIdAndUpdate(userId, { plan, stripeCustomerId });
  debugBilling('checkout completed synchronized customer', { userId, stripeCustomerId, stripeSubscriptionId });
}

async function handleSubscriptionCreated(subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  const stripeCustomerId = getStripeId(subscription.customer);
  await Subscription.findOneAndUpdate(
    { user: userId },
    {
      stripeCustomerId,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined,
      cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end)
    },
    { upsert: true }
  );
  await User.findByIdAndUpdate(userId, { stripeCustomerId });
  debugBilling('subscription created synchronized customer', { userId, stripeCustomerId, stripeSubscriptionId: subscription.id });
}

async function handleSubscriptionDeleted(subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;
  const stripeCustomerId = getStripeId(subscription.customer);

  await Subscription.findOneAndUpdate(
    { user: userId },
    {
      plan: FREE_PLAN_KEY,
      status: 'cancelled',
      stripeCustomerId,
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

async function resolveStripeCustomer(user, subscription, context) {
  if (!stripe) throw new AppError('Stripe is not configured', 503);

  const userId = user.id;
  const mongoUserId = user._id?.toString?.() || userId;
  const storedCustomerId = user.stripeCustomerId;
  const subscriptionCustomerId = subscription?.stripeCustomerId;
  debugBilling('stripe customer resolution started', {
    context,
    authenticatedUserId: userId,
    mongoUserId,
    storedStripeCustomerId: storedCustomerId,
    subscriptionStripeCustomerId: subscriptionCustomerId
  });

  for (const customerId of uniqueIds([storedCustomerId, subscriptionCustomerId])) {
    const customer = await retrieveStripeCustomer(customerId);
    if (customer) {
      await syncStripeCustomerId(userId, subscription, customer.id);
      debugBilling('stripe customer lookup result', {
        context,
        authenticatedUserId: userId,
        mongoUserId,
        stripeCustomerId: customer.id,
        result: 'valid'
      });
      return customer.id;
    }

    await clearStripeCustomerId(userId, subscription?._id, customerId);
    debugBilling('stripe customer lookup result', {
      context,
      authenticatedUserId: userId,
      mongoUserId,
      stripeCustomerId: customerId,
      result: 'missing_cleared'
    });
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId }
  });
  await syncStripeCustomerId(userId, subscription, customer.id);
  debugBilling('new stripe customer created', {
    context,
    authenticatedUserId: userId,
    mongoUserId,
    stripeCustomerId: customer.id
  });
  return customer.id;
}

async function retrieveStripeCustomer(customerId) {
  if (!customerId) return null;
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer?.deleted ? null : customer;
  } catch (error) {
    if (isMissingStripeCustomer(error)) return null;
    throw error;
  }
}

function isMissingStripeCustomer(error) {
  return error?.message?.toLowerCase().includes('no such customer') || (
    error?.code === 'resource_missing' && (!error?.param || error.param === 'customer')
  );
}

async function clearStripeCustomerId(userId, subscriptionId, customerId) {
  await User.updateOne({ _id: userId, stripeCustomerId: customerId }, { $unset: { stripeCustomerId: '' } });
  if (subscriptionId) {
    await Subscription.updateOne({ _id: subscriptionId, stripeCustomerId: customerId }, { $unset: { stripeCustomerId: '' } });
  } else {
    await Subscription.updateMany({ user: userId, stripeCustomerId: customerId }, { $unset: { stripeCustomerId: '' } });
  }
}

async function syncStripeCustomerId(userId, subscription, customerId) {
  await User.findByIdAndUpdate(userId, { stripeCustomerId: customerId });
  if (subscription?._id) {
    await Subscription.findByIdAndUpdate(subscription._id, { stripeCustomerId: customerId });
  }
}

function uniqueIds(ids) {
  return [...new Set(ids.filter(Boolean))];
}

function getStripeId(value) {
  return typeof value === 'string' ? value : value?.id;
}

async function logStripeRuntimeDiagnostics(priceId, checkoutParams) {
  console.log('\n========== STRIPE RUNTIME DIAGNOSTICS ==========');
  console.log('Stripe API version:', stripeApiVersion);
  console.log('Stripe SDK version:', stripe.VERSION);
  console.log('Exact request body:', checkoutParams);
  console.log('priceId:', priceId);

  const account = await stripe.accounts.retrieve();
  console.log('Stripe Account ID:', account.id);
  console.log('Stripe Account Branding:', getAccountBrandingSnapshot(account));

  const price = await stripe.prices.retrieve(priceId);
  console.log('Stripe Price:', {
    id: price.id,
    type: price.type,
    recurring: price.recurring,
    currency: price.currency,
    product: getStripeId(price.product),
    active: price.active,
    livemode: price.livemode
  });

  const productId = getStripeId(price.product);
  const product = await stripe.products.retrieve(productId);
  console.log('Stripe Product:', {
    id: product.id,
    default_price: getStripeId(product.default_price),
    active: product.active,
    livemode: product.livemode
  });
  console.log('Price Owner Account:', account.id);
  console.log('Price billing type:', price.recurring ? 'recurring' : 'one-time');
  console.log('================================================\n');
}

function buildClientUrl(path, name) {
  let url;
  try {
    url = new URL(path, env.clientUrl);
  } catch {
    throw new AppError(
      `Stripe ${name} must be a valid URL`,
      503,
      { [name]: `${env.clientUrl}${path}` }
    );
  }

  assertStripeRedirectUrl(url, name);
  return url.toString();
}

function assertStripeRedirectUrl(url, name) {
  let parsed;
  try {
    parsed = url instanceof URL ? url : new URL(url);
  } catch {
    throw new AppError(`Stripe ${name} must be a valid URL`, 503, { [name]: url });
  }

  const isLocalHttp = parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname);
  if (parsed.protocol !== 'https:' && !(env.nodeEnv !== 'production' && isLocalHttp)) {
    throw new AppError(
      `Stripe ${name} must be a valid HTTPS URL. In development, http://localhost and http://127.0.0.1 are allowed.`,
      503,
      { [name]: parsed.toString() }
    );
  }
}

function logCheckoutRequest({ checkoutParams, customerEmail }) {
  console.log('========== STRIPE CHECKOUT REQUEST ==========');
  console.log({
    customerEmail,
    checkoutParams,
    nodeVersion: process.version,
    stripeSdkVersion: stripe.VERSION,
    stripeApiVersion,
    renderRegion: process.env.RENDER_REGION,
    nodeEnv: env.nodeEnv
  });
  console.log('=============================================');
}

async function getStripeAccountBranding() {
  const account = await stripe.accounts.retrieve();
  return getAccountBrandingSnapshot(account);
}

async function ensureStripeAccountBranding() {
  const account = await stripe.accounts.retrieve();
  const currentBranding = getAccountBrandingSnapshot(account);
  const expectedName = env.stripe.accountDisplayName;

  if (env.stripe.expectedAccountId && account.id !== env.stripe.expectedAccountId) {
    throw new AppError('Stripe is using a different account than expected. Check STRIPE_SECRET_KEY and price IDs.', 503, {
      expectedAccountId: env.stripe.expectedAccountId,
      actualAccountId: account.id
    });
  }

  if (!expectedName || currentBranding.businessProfileName === expectedName) return currentBranding;

  try {
    const updatedAccount = await stripe.accounts.update(account.id, {
      business_profile: { name: expectedName }
    });
    const updatedBranding = getAccountBrandingSnapshot(updatedAccount);
    debugBilling('stripe account branding synchronized', { before: currentBranding, after: updatedBranding });
    return updatedBranding;
  } catch (error) {
    debugBilling('stripe account branding synchronization skipped', {
      expectedName,
      currentBranding,
      message: error.message
    });
    return currentBranding;
  }
}

function getAccountBrandingSnapshot(account) {
  return {
    accountId: account.id,
    businessProfileName: account.business_profile?.name || null,
    businessProfileUrl: account.business_profile?.url || null,
    statementDescriptor: account.settings?.payments?.statement_descriptor || null,
    dashboardDisplayName: account.settings?.dashboard?.display_name || null,
    livemode: account.livemode
  };
}

function serializeStripeError(error) {
  return {
    type: error.type,
    code: error.code,
    param: error.param,
    message: error.message,
    rawMessage: error.raw?.message,
    requestId: error.requestId,
    statusCode: error.statusCode || error.status,
    raw: error.raw,
    headers: error.headers,
    stack: error.stack
  };
}

function debugBilling(message, details = {}) {
  if (env.nodeEnv === 'production') return;
  console.log(`[billing:stripe] ${message}`, details);
}
