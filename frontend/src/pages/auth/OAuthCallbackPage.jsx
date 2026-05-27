import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { hydrateSessionFromRefresh } from '../../services/oauthService.js';
import { useAuthStore } from '../../store/authStore.js';

export function OAuthCallbackPage() {
  const [message, setMessage] = useState('Completing secure Google sign in...');
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();

  useEffect(() => {
    hydrateSessionFromRefresh(setSession)
      .then(() => {
        window.opener?.postMessage({ type: 'cloudnest:oauth-success' }, window.location.origin);
        toast.success('Signed in with Google');
        setMessage('Google sign in complete. Redirecting...');
        if (window.opener) {
          window.close();
        } else {
          navigate('/app', { replace: true });
        }
      })
      .catch(() => {
        window.opener?.postMessage({ type: 'cloudnest:oauth-error' }, window.location.origin);
        setMessage('Google sign in could not be completed.');
      });
  }, [navigate, setSession]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#05070b] p-6 text-cyan-50">
      <section className="premium-card w-full max-w-md p-6 text-center">
        <div className="eyebrow">Google OAuth</div>
        <h1 className="font-display mt-5 text-2xl font-semibold">{message}</h1>
        <p className="mt-3 text-sm text-slate-500">Your refresh session is stored in a secure HttpOnly cookie.</p>
      </section>
    </main>
  );
}
