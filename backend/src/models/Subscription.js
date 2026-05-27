import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    plan: { type: String, enum: ['starter', 'pro', 'business'], default: 'starter' },
    status: { type: String, default: 'free' },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: { type: Boolean, default: false },
    invoices: [
      {
        stripeInvoiceId: String,
        amountPaid: Number,
        currency: String,
        hostedInvoiceUrl: String,
        paidAt: Date
      }
    ]
  },
  { timestamps: true }
);

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
