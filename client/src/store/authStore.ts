import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthUser, PendingVerification } from "../types/auth";

interface AuthState {
  user: AuthUser | null;
  pendingVerification: PendingVerification | null;
  isAuthenticated: boolean;
  login: (userData: AuthUser) => void;
  setPendingVerification: (pendingVerification: PendingVerification) => void;
  clearPendingVerification: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
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
      name: "mediguide-auth-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
