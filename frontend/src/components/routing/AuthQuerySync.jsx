import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore.js';

export function AuthQuerySync() {
  const queryClient = useQueryClient();
  const hydrated = useAuthStore((state) => state.hydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const userId = useAuthStore((state) => state.user?._id || state.user?.id || null);
  const sessionVersion = useAuthStore((state) => state.sessionVersion);
  const previousSessionRef = useRef(null);

  useEffect(() => {
    if (!hydrated) return;

    const sessionKey = accessToken ? `${userId || 'user'}:${accessToken}` : null;
    const previousSession = previousSessionRef.current;
    previousSessionRef.current = sessionKey;

    if (!sessionKey) {
      queryClient.removeQueries();
      return;
    }

    if (previousSession !== sessionKey) {
      queryClient.invalidateQueries();
      queryClient.refetchQueries({ type: 'active' });
    }
  }, [accessToken, hydrated, queryClient, sessionVersion, userId]);

  return null;
}
