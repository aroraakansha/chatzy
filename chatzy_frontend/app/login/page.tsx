"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/auth-forms";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { authService, isTokenExpired } from "@/features/auth/services/auth-service";

export default function LoginPage() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);

  // If the user already has a session, push them to the dashboard automatically
  useEffect(() => {
    if (session?.token) {
      if (isTokenExpired(session.token)) {
        logout();
        authService.logout();
        return;
      }
      router.push("/dashboard");
    }
  }, [logout, router, session]);

  return (
    <AuthShell title="Welcome back" subtitle="Login to continue your Chatzy conversations.">
      <LoginForm />
    </AuthShell>
  );
}
