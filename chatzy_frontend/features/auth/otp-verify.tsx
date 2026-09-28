"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authService } from "@/features/auth/services/auth-service";
import { useAuthStore } from "@/features/auth/store/auth-store";

const SIGNUP_CHALLENGE_KEY = "chatzy-signup-challenge";

export default function VerifyOtpPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // 1. Try reading from URL search params
    const queryEmail = searchParams.get("email");
    const queryPhone = searchParams.get("phone");

    if (queryEmail || queryPhone) {
      setEmail(queryEmail || "");
      setPhone(queryPhone || "");
    } else {
      // 2. Fallback to sessionStorage if query params are missing
      try {
        const stored = sessionStorage.getItem(SIGNUP_CHALLENGE_KEY);
        if (stored) {
          const challenge = JSON.parse(stored);
          if (challenge.method === "email") {
            setEmail(challenge.contact);
          } else {
            setPhone(challenge.contact);
          }
        }
      } catch {
        // ignore parsing error
      }
    }
  }, [searchParams]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authService.verifyOtp(email, phone, otp); 

      // If backend returns a session/token, save it in the auth store
      if (response && typeof response === "object") {
        setSession(response as any);
      }

      sessionStorage.removeItem(SIGNUP_CHALLENGE_KEY);

      // Redirect to dashboard/chat on success
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg p-6 shadow-md border bg-white">
        <h2 className="text-2xl font-bold mb-2">Enter Verification Code</h2>
        <p className="text-sm text-gray-600 mb-6">
          We sent a verification code to <span className="font-semibold">{email || phone}</span>
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="------"
            className="w-full rounded-md border px-4 py-3 text-center text-xl tracking-widest"
            required
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[#008069] py-2.5 text-white font-semibold hover:bg-[#006a55] disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}