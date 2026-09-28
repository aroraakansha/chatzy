"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/features/auth/services/auth-service";
import { useAuthStore } from "@/features/auth/store/auth-store";

export default function GoogleSuccessPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [message, setMessage] = useState("Finishing your Google Contacts connection…");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setMessage("Google did not return a session. Please try connecting your contacts again.");
      return;
    }

    void authService.completeGoogleLogin(token)
      .then((session) => {
        setSession(session);
        router.replace("/contacts");
      })
      .catch(() => {
        setMessage("We couldn't finish connecting Google. Please try again.");
      });
  }, [router, setSession]);

  return (
    <main className="ambient-shell grid min-h-dvh place-items-center p-5">
      <section className="w-full max-w-md rounded-[32px] border border-white/70 bg-white/90 p-8 text-center shadow-[0_24px_70px_rgb(28_45_38/0.14)] backdrop-blur-xl">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e7f7f1] text-[#008069]">
          <CheckCircle2 size={28} />
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-[#17211c]">Connect your contacts</h1>
        <p className="mt-3 text-sm leading-6 text-[#66756f]">{message}</p>
      </section>
    </main>
  );
}
