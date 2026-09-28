"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthSession } from "@/features/auth/types/auth.types";

type AuthStore = {
  session: AuthSession | null;
  setSession: (session: AuthSession | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      logout: () => set({ session: null }),
    }),
    {
      name: "chatzy-auth-storage", // Saves the session in localStorage automatically
    }
  )
);