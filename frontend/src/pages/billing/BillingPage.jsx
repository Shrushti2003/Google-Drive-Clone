import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Cloud, CreditCard, Crown, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AmbientBackground } from '../../components/effects/AmbientBackground.jsx';
import { CursorGlow } from '../../components/effects/CursorGlow.jsx';
import { api, getApiError } from '../../services/apiClient.js';
import { SUBSCRIPTION_PLANS } from '../../config/subscriptionPlans.js';
import { useAuthStore } from '../../store/authStore.js';
import { formatBytes } from '../../utils/formatters.js';

const paidPlans = new Set(['pro', 'business']);

export function BillingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const requestedPlan = searchParams.get('plan');
  const [selectedPlan, setSelectedPlan] = useState(paidPlans.has(requestedPlan) ? requestedPlan : null);

  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/dashboard')).data,
    enabled: Boolean(accessToken)
  });

  const subscriptionQuery = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => (await api.get('/billing/subscription')).data,
    enabled: Boolean(accessToken)
  });

  const currentPlan = dashboardQuery.data?.storage?.plan || subscriptionQuery.data?.subscription?.plan || user?.plan || null;
  const storage = dashboardQuery.data?.storage;
  const activePlan = SUBSCRIPTION_PLANS.find((plan) => plan.key === currentPlan);
  const selectedPlanDetails = SUBSCRIPTION_PLANS.find((plan) => plan.key === selectedPlan);

  useEffect(() => {
    if (paidPlans.has(requestedPlan)) setSelectedPlan(requestedPlan);
  }, [requestedPlan]);

  const checkout = useMutation({
    mutationFn: async (plan) => (await api.post('/billing/checkout', { plan })).data,
    onSuccess: ({ url }) => {
      if (!url) {
        toast.error('Stripe did not return a checkout URL');
        return;
      }
      window.location.assign(url);
    },
    onError: (error) => {
      if (error?.response?.status === 401) {
        navigate('/login', { state: { from: { pathname: '/pricing', search: selectedPlan ? `?plan=${selectedPlan}` : '' } } });
        return;
      }
      toast.error(getApiError(error));
    }
  });

  const portal = useMutation({
    mutationFn: async () => (await api.post('/billing/portal')).data,
    onSuccess: ({ url }) => {
      if (url) window.location.assign(url);
    },
    onError: (error) => {
      if (error?.response?.status === 401) {
        navigate('/login', { state: { from: { pathname: '/pricing', search: '' } } });
        return;
      }
      toast.error(getApiError(error));
    }
  });

  function choosePlan(planKey) {
    if (planKey === 'starter') {
      if (accessToken) {
        toast('Starter is already included with every CloudNest account.');
      } else {
        navigate('/signup', { state: { from: { pathname: '/app', search: '' } } });
      }
      return;
    }
    setSelectedPlan(planKey);
    setSearchParams({ plan: planKey });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startCheckout() {
    if (!selectedPlanDetails || !paidPlans.has(selectedPlanDetails.key)) return;
    if (!accessToken) {
      navigate('/login', { state: { from: { pathname: '/pricing', search: `?plan=${selectedPlanDetails.key}` } } });
      return;
    }
    checkout.mutate(selectedPlanDetails.key);
  }

  const usagePercent = useMemo(() => Math.min(100, Math.max(0, storage?.percent || 0)), [storage?.percent]);
  const hasBilling = Boolean(accessToken && currentPlan && currentPlan !== 'starter');

  return (
    <main className="relative min-h-screen overflow-hidden text-cyan-50">
      <AmbientBackground dense />
      <CursorGlow />

      <nav className="section sticky top-0 z-30 flex items-center justify-between py-5">
        <Link to="/" className="glass-panel flex items-center gap-3 px-3 py-2 font-display font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-300 text-slate-950 shadow-[0_0_28px_rgba(103,232,249,.35)]"><Cloud size={19} /></span>
          CloudNest
        </Link>
        <div className="flex gap-2">
          {accessToken ? <Link className="btn-secondary" to="/app">Open Drive</Link> : <Link className="btn-secondary" to="/login" state={{ from: { pathname: '/pricing', search: selectedPlan ? `?plan=${selectedPlan}` : '' } }}>Sign in</Link>}
          {hasBilling && (
            <button className="btn-primary" type="button" onClick={() => portal.mutate()} disabled={portal.isPending}>
              <ExternalLink size={17} /> {portal.isPending ? 'Opening...' : 'Manage billing'}
            </button>
          )}
        </div>
      </nav>

      <section className="section pb-20 pt-10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="eyebrow mx-auto w-fit"><Sparkles size={15} /> CloudNest storage plans</div>
          <h1 className="font-display mt-6 text-5xl font-semibold tracking-normal sm:text-7xl">Upgrade for more storage.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400">
            Compare plans, review your monthly subscription, then continue to Stripe Checkout for a real test-mode card payment.
          </p>
        </div>

        {accessToken && (
          <div className="premium-card mx-auto mt-10 max-w-4xl p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-sm text-slate-500">Current plan</div>
                <div className="font-display mt-1 text-2xl font-semibold">{activePlan?.name || 'Starter'}</div>
              </div>
              <div className="text-right text-sm text-slate-400">
                {storage ? `${formatBytes(storage.used)} of ${formatBytes(storage.limit)} used` : 'Loading usage...'}
              </div>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-cyan-300 shadow-[0_0_20px_rgba(103,232,249,.55)]" style={{ width: `${usagePercent}%` }} />
            </div>
            <div className="mt-2 text-xs text-slate-500">{usagePercent}% used</div>
          </div>
        )}

        {selectedPlanDetails && (
          <motion.div className="premium-card mx-auto mt-8 max-w-4xl p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid gap-5 md:grid-cols-[1fr_0.7fr] md:items-center">
              <div>
                <div className="eyebrow w-fit">Checkout review</div>
                <h2 className="font-display mt-3 text-3xl font-semibold">{selectedPlanDetails.name}</h2>
                <p className="mt-2 text-sm text-slate-400">{selectedPlanDetails.detail} billed monthly. You will complete payment on Stripe Checkout.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Monthly price</span>
                  <span className="font-semibold text-cyan-50">{selectedPlanDetails.price}/month</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span>Storage after payment</span>
                  <span className="font-semibold text-cyan-50">{selectedPlanDetails.storageGb} GB</span>
                </div>
              </div>
            </div>
            <button className="btn-primary mt-6 w-full" type="button" onClick={startCheckout} disabled={checkout.isPending || selectedPlanDetails.key === currentPlan}>
              {selectedPlanDetails.key === currentPlan ? 'Current plan' : checkout.isPending ? 'Opening Stripe Checkout...' : `Continue to Stripe for ${selectedPlanDetails.name}`}
              {!checkout.isPending && selectedPlanDetails.key !== currentPlan && <ArrowRight size={18} />}
            </button>
            <p className="mt-3 text-center text-xs leading-5 text-slate-500">
              Backend-only Stripe session creation. Secret keys never reach the browser.
            </p>
          </motion.div>
        )}

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {SUBSCRIPTION_PLANS.map((plan, index) => {
            const isCurrent = plan.key === currentPlan;
            const isSelected = plan.key === selectedPlan;
            return (
              <motion.article
                key={plan.key}
                className={`premium-card flex min-h-[520px] flex-col p-6 ${isSelected ? 'border-cyan-200/40 shadow-[0_0_80px_rgba(103,232,249,.16)]' : ''}`}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-2xl font-semibold">{plan.name}</h2>
                      {index === 1 && <span className="rounded-md border border-cyan-200/20 bg-cyan-200/[0.08] px-2 py-1 text-xs text-cyan-100">Recommended</span>}
                      {isCurrent && <span className="rounded-md border border-white/10 bg-white/[0.07] px-2 py-1 text-xs text-slate-300">Current</span>}
                    </div>
                    <p className="mt-6 text-5xl font-bold">{plan.price}<span className="text-sm font-medium text-slate-500">{plan.key === 'starter' ? '' : '/month'}</span></p>
                    <p className="mt-3 text-sm text-slate-400">{plan.detail}</p>
                  </div>
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-cyan-300/10 text-cyan-100">
                    {plan.key === 'starter' ? <ShieldCheck size={21} /> : <Crown size={21} />}
                  </div>
                </div>

                <div className="mt-8 grid gap-3 text-sm text-slate-300">
                  {plan.features.map((item) => (
                    <div key={item} className="flex gap-2">
                      <Check size={17} className="shrink-0 text-cyan-200" /> {item}
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-8">
                  <button
                    className={isCurrent ? 'btn-secondary w-full' : 'btn-primary w-full'}
                    type="button"
                    disabled={isCurrent}
                    onClick={() => choosePlan(plan.key)}
                  >
                    {isCurrent ? 'Current plan' : plan.key === 'starter' ? 'Start free' : 'Review upgrade'}
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>

        <section className="premium-card mt-10 grid gap-5 p-6 md:grid-cols-3">
          <div>
            <CreditCard className="text-cyan-200" />
            <h3 className="font-display mt-4 text-lg font-semibold">Stripe Checkout</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">Card entry, tax-ready payment handling, and secure redirect happen on Stripe.</p>
          </div>
          <div>
            <ShieldCheck className="text-cyan-200" />
            <h3 className="font-display mt-4 text-lg font-semibold">Backend secured</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">CloudNest never exposes secret keys and only updates paid plans after checkout confirmation.</p>
          </div>
          <div>
            <Sparkles className="text-cyan-200" />
            <h3 className="font-display mt-4 text-lg font-semibold">Storage synced</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">Successful subscriptions update your plan quota and dashboard storage limits automatically.</p>
          </div>
        </section>
      </section>
    </main>
  );
}
