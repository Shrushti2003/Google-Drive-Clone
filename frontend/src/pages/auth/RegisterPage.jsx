import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Cloud } from 'lucide-react';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton.jsx';
import { PasswordToggle } from '../../components/ui/PasswordToggle.jsx';
import { api, getApiError } from '../../services/apiClient.js';
import { hydrateSessionFromRefresh } from '../../services/oauthService.js';
import { useAuthStore } from '../../store/authStore.js';

export function RegisterPage() {
  const [show, setShow] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from
    ? `${location.state.from.pathname || '/app'}${location.state.from.search || ''}`
    : '/app';

  useEffect(() => {
    function onOAuthMessage(event) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'cloudnest:oauth-success') {
        hydrateSessionFromRefresh(setSession)
          .then(() => navigate(redirectTo, { replace: true }))
          .catch(() => toast.error('Google sign in session could not be restored'));
      }
      if (event.data?.type === 'cloudnest:oauth-error') {
        toast.error('Google sign in failed');
      }
    }
    window.addEventListener('message', onOAuthMessage);
    return () => window.removeEventListener('message', onOAuthMessage);
  }, [navigate, redirectTo, setSession]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (form.password !== confirm) throw new Error('Passwords do not match');
      return (await api.post('/auth/register', form)).data;
    },
    onSuccess: (data) => {
      setSession(data.user, data.accessToken);
      toast.success('Workspace created');
      navigate(redirectTo, { replace: true });
    },
    onError: (error) => toast.error(getApiError(error))
  });

  return (
    <form className="premium-card w-full max-w-md rounded-3xl border-white/5 bg-[rgba(13,18,37,.42)] p-8 shadow-[inset_0_0_20px_rgba(20,184,166,.05)] sm:p-10" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
      <Link className="mb-8 flex items-center gap-2 lg:hidden" to="/">
        <Cloud className="text-[#14b8a6]" size={24} fill="currentColor" />
        <span className="font-display text-2xl font-semibold text-[#14b8a6]">CloudNest</span>
      </Link>
      <h1 className="font-display text-3xl font-semibold tracking-normal text-white">Create your CloudNest account</h1>
      <label className="mt-7 block text-xs font-semibold uppercase tracking-wider text-[#bbcac6]/80">Full Name<input className="input mt-2 h-14 rounded-xl px-5" placeholder="Enter your name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
      <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-[#bbcac6]/80">Email Address<input className="input mt-2 h-14 rounded-xl px-5" placeholder="you@example.com" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
      <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-[#bbcac6]/80">Create Password
        <span className="relative mt-2 block">
          <input className="input h-16 rounded-xl px-6 pr-14" placeholder="Minimum 8 characters" type={show ? 'text' : 'password'} required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <PasswordToggle visible={show} onToggle={() => setShow(!show)} />
        </span>
      </label>
      <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-[#bbcac6]/80">Confirm Password<input className="input mt-2 h-16 rounded-xl px-6" placeholder="Re-enter your password" type={show ? 'text' : 'password'} required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>
      <button className="btn-primary mt-8 h-14 w-full rounded-xl" disabled={mutation.isPending}>{mutation.isPending ? 'Creating...' : 'Create Free Account'}</button>
      <div className="relative my-4 flex items-center justify-center py-2">
        <div className="w-full border-t border-white/10" />
        <span className="absolute bg-[#0b101f] px-4 text-xs font-bold uppercase tracking-widest text-[#bbcac6]/50">OR</span>
      </div>
      <GoogleAuthButton />
      <p className="mt-5 text-center text-sm text-[#bbcac6]">Already using CloudNest? <Link className="font-semibold text-[#14b8a6] hover:underline" to="/login" state={{ from: location.state?.from }}>Log in</Link></p>
    </form>
  );
}
