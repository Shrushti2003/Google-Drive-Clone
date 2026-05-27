import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      hydrated: false,
      sessionVersion: 0,
      setSession: (user, accessToken) => set((state) => ({
        user,
        accessToken,
        sessionVersion: state.sessionVersion + 1
      })),
      updateUser: (user) => set((state) => ({ user: { ...state.user, ...user } })),
      clearSession: () => set((state) => ({
        user: null,
        accessToken: null,
        sessionVersion: state.sessionVersion + 1
      })),
      setHydrated: () => set({ hydrated: true })
    }),
    {
      name: 'cloudnest-session',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      }
    }
  )
);
