import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from '../../services/apiClient.js';
import { useAuthStore } from '../../store/authStore.js';

export function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthStore((state) => state.hydrated);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    let active = true;
    setIsHydrating(true);
    const restoreSession = token
      ? api.get('/auth/me').catch(() => api.post('/auth/refresh'))
      : api.post('/auth/refresh');

    restoreSession
      .then((response) => {
        if (!active) return;
        if (response.data?.accessToken) {
          setSession(response.data.user, response.data.accessToken);
        } else if (response.data?.user) {
          const latestToken = useAuthStore.getState().accessToken;
          if (latestToken) setSession(response.data.user, latestToken);
        }
      })
      .catch(() => {
        if (active) clearSession();
      })
      .finally(() => {
        if (active) setIsHydrating(false);
      });

    return () => { active = false; };
  }, [clearSession, hydrated, setSession, token]);

  if (!hydrated || isHydrating) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#05070b] text-cyan-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-200/20 border-t-cyan-200" />
          <p className="mt-4 text-sm text-slate-400">Restoring CloudNest session...</p>
        </div>
      </div>
    );
  }

  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}
