import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      pendingVerification: null,
      isAuthenticated: false,
      login: (userData) =>
        set({
          user: userData,
          pendingVerification: null,
          isAuthenticated: true,
        }),
      setPendingVerification: (pendingVerification) =>
        set({
          user: null,
          pendingVerification,
          isAuthenticated: false,
        }),
      clearPendingVerification: () =>
        set((state) => ({
          ...state,
          pendingVerification: null,
        })),
      logout: () =>
        set({
          user: null,
          pendingVerification: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'mediguide-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
