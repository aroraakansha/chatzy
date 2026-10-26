"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, saveSession } from "@/features/chat/api";

function CompleteGoogleSignIn() {
  const params = useSearchParams(); const router = useRouter();
  useEffect(() => {
    const token = params.get("token");
    if (!token) { router.replace("/login"); return; }
    void api.me(token).then((user) => { saveSession({ token, user }); router.replace("/dashboard"); }).catch(() => router.replace("/login?error=google"));
  }, [params, router]);
  return <main className="loading-screen"><span className="logo-orbit">c</span><span>Bringing you back to your people…</span></main>;
}

export default function GoogleSuccessPage() { return <Suspense fallback={<main className="loading-screen"><span className="logo-orbit">c</span><span>Finding your people…</span></main>}><CompleteGoogleSignIn /></Suspense>; }
