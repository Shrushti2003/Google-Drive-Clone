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

export function LoginPage() {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', remember: true });
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
    mutationFn: async () => (await api.post('/auth/login', form)).data,
    onSuccess: (data) => {
      setSession(data.user, data.accessToken);
      toast.success('Welcome back');
      navigate(redirectTo, { replace: true });
    },
    onError: (error) => toast.error(getApiError(error))
  });

  return (
    <form className="premium-card glass-card w-full max-w-md rounded-xl p-8 sm:p-12" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded bg-[#4fdbc8] text-[#003731]"><Cloud size={20} fill="currentColor" /></div>
        <span className="font-display text-2xl font-bold tracking-tight text-white">CloudNest</span>
      </div>
      <div className="mt-7">
        <h1 className="font-display text-3xl font-semibold tracking-normal text-[#dde4e1]">Welcome back</h1>
        <p className="mt-2 text-base leading-6 text-[#bbcac6]">Log in to continue managing your files, folders, and shared workspaces.</p>
      </div>
      <label className="mt-7 block text-xs font-semibold uppercase tracking-widest text-[#bbcac6]">Email Address<input className="input mt-2 h-14 rounded-lg bg-[#090f0e]" placeholder="Enter your email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
      <label className="mt-4 block text-xs font-semibold uppercase tracking-widest text-[#bbcac6]">Password
        <span className="relative mt-2 block">
          <input className="input h-14 rounded-lg bg-[#090f0e] pr-10" placeholder="Enter your password" type={show ? 'text' : 'password'} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <PasswordToggle visible={show} onToggle={() => setShow(!show)} />
        </span>
      </label>
      <div className="mt-4 flex items-center justify-between text-sm text-[#bbcac6]">
        <label className="flex cursor-pointer items-center gap-2"><input className="h-4 w-4 rounded border-[#3c4947] bg-[#090f0e] accent-[#4fdbc8]" type="checkbox" checked={form.remember} onChange={(e) => setForm({ ...form, remember: e.target.checked })} /> Remember me</label>
        <Link className="font-medium text-[#4fdbc8] hover:underline" to="/forgot-password">Forgot password?</Link>
      </div>
      <button className="btn-primary mt-6 h-14 w-full rounded-lg text-lg" disabled={mutation.isPending}>{mutation.isPending ? 'Signing in...' : 'Sign In'}</button>
      <div className="my-4 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs font-semibold text-[#bbcac6]">or continue with</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <GoogleAuthButton />
      <p className="mt-5 text-center text-sm text-[#bbcac6]">Don&apos;t have an account? <Link className="font-bold text-[#4fdbc8] hover:underline" to="/signup" state={{ from: location.state?.from }}>Create one</Link></p>
    </form>
  );
}
