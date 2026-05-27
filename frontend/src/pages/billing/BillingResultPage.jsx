import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api, getApiError } from '../../services/apiClient.js';
import { useAuthStore } from '../../store/authStore.js';

export function BillingResultPage({ status }) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const updateUser = useAuthStore((state) => state.updateUser);
  const isSuccess = status === 'success';
  const sessionId = new URLSearchParams(location.search).get('session_id');
  const syncCheckout = useMutation({
    mutationFn: async () => (await api.post('/billing/checkout/sync', { sessionId })).data,
    onSuccess: (data) => {
      if (data.user) updateUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });

  const subscription = useQuery({
    queryKey: ['subscription', 'billing-result'],
    queryFn: async () => (await api.get('/billing/subscription')).data,
    enabled: Boolean(accessToken && isSuccess && !syncCheckout.isPending)
  });

  useEffect(() => {
    if (accessToken && isSuccess && sessionId && !syncCheckout.isPending && !syncCheckout.isSuccess && !syncCheckout.isError) {
      syncCheckout.mutate();
    }
  }, [accessToken, isSuccess, sessionId, syncCheckout]);

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10 text-cyan-50">
      <section className="premium-card w-full max-w-lg p-7 text-center">
        <div className={`mx-auto grid h-14 w-14 place-items-center rounded-lg ${isSuccess ? 'bg-cyan-300/15 text-cyan-100' : 'bg-rose-400/10 text-rose-200'}`}>
          {isSuccess ? <CheckCircle2 size={30} /> : <XCircle size={30} />}
        </div>
        <div className="eyebrow mt-6">{isSuccess ? 'Payment complete' : 'Checkout cancelled'}</div>
        <h1 className="font-display mt-5 text-3xl font-semibold">
          {isSuccess ? 'Your CloudNest subscription is being activated.' : 'No payment was processed.'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          {isSuccess
            ? 'Stripe has confirmed checkout. CloudNest is syncing your subscription and storage limit.'
            : 'You can return to CloudNest and choose a plan whenever you are ready.'}
        </p>
        {syncCheckout.isError && (
          <div className="mt-5 rounded-lg border border-amber-300/20 bg-amber-300/10 p-4 text-left text-sm text-amber-100">
            Checkout completed, but instant sync needs attention: {getApiError(syncCheckout.error)}
          </div>
        )}
        {isSuccess && accessToken && (
          <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.045] p-4 text-left text-sm text-slate-400">
            <div className="font-semibold text-cyan-50">Current status</div>
            <div className="mt-1 capitalize">
              {syncCheckout.isPending ? 'Syncing subscription...' : `${subscription.data?.subscription?.plan || 'Syncing'} plan`}
            </div>
          </div>
        )}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link className="btn-primary" to="/app">Open dashboard</Link>
          {!isSuccess && <Link className="btn-secondary" to={`/pricing${location.search}`}>View plans</Link>}
        </div>
      </section>
    </main>
  );
}
