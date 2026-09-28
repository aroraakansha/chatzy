"use client";

import type { AuthSession, AuthUser } from "@/features/auth/types/auth.types";
import { apiClient } from "@/shared/lib/api-client";

export type SignupDetails = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
};

export type SignupVerificationChallenge = {
  verificationId: string;
  expiresAt?: string;
  message?: string;
};

export function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(base64)) as { exp?: unknown };
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const expiresAt = getTokenExpiry(token);
  return expiresAt === null || expiresAt <= Date.now();
}

function extractAuthToken(payload: any): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const candidates = [
    payload.token,
    payload.accessToken,
    payload.jwt,
    payload.access_token,
    payload.authenticationToken,
    payload.authToken,
    payload.auth_token,
    payload.data?.token,
    payload.data?.accessToken,
    payload.data?.jwt,
    payload.data?.access_token,
    payload.data?.authenticationToken,
    payload.data?.authToken,
    payload.data?.auth_token,
    payload.data?.data?.token,
  ];

  return candidates.find((item) => typeof item === "string" && item.trim().length > 0) ?? "";
}

function extractUserImage(payload: any): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const candidates = [
    payload.imageUrl,
    payload.avatarUrl,
    payload.profileImage,
    payload.photoUrl,
    payload.dpUrl,
    payload.avatar,
    payload.picture,
    payload.photo,
    payload.user?.imageUrl,
    payload.user?.avatarUrl,
    payload.user?.profileImage,
    payload.user?.photoUrl,
    payload.data?.imageUrl,
    payload.data?.avatarUrl,
    payload.data?.profileImage,
    payload.data?.photoUrl,
  ];

  return candidates.find((item) => typeof item === "string" && item.trim().length > 0) ?? "";
}

function setAuthCookie(token: string) {
  if (typeof document === "undefined") return;

  const maxAge = 7 * 24 * 60 * 60; // 7 days
  document.cookie = `chatzy-auth-token=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; samesite=lax`;
}

function clearAuthCookie() {
  if (typeof document === "undefined") return;

  document.cookie = "chatzy-auth-token=; path=/; max-age=0; samesite=lax";
}

export const authService = {
  // Real login: sends data to Spring Boot, receives actual JWT
  login: async (email: string, password: string): Promise<AuthSession> => {
    const response = await apiClient.post<Record<string, any>>(`/auth/login`, { email, password });

    const token = extractAuthToken(response.data);
    const userPayload = response.data?.user ?? response.data;
    const imageUrl = extractUserImage(userPayload);

    // eslint-disable-next-line no-console
    console.log("authService.login response:", response.data, { tokenPresent: Boolean(token) });

    if (!token) {
      throw new Error("Login response did not include a valid auth token.");
    }

    setAuthCookie(token);
    // Apply Authorization header for subsequent requests
    try {
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } catch (e) {
      // ignore in non-browser environments
    }

    return {
      token,
      user: {
        id: userPayload?.id ?? response.data.user?.id ?? "",
        name: userPayload?.name ?? response.data.user?.name ?? email.split("@")[0],
        email: userPayload?.email ?? response.data.user?.email ?? email,
        phone: userPayload?.phone ?? response.data.user?.phone ?? "",
        imageUrl,
      },
    };
  },

  logout: () => {
    clearAuthCookie();
    try {
      delete apiClient.defaults.headers.common["Authorization"];
    } catch (e) {
      // ignore
    }
  },

  getCurrentUser: async (token: string): Promise<AuthUser> => {
    const response = await apiClient.get<any>(`/auth/me`, { headers: { Authorization: `Bearer ${token}` } });

    const userPayload = response.data?.user ?? response.data;
    const imageUrl = extractUserImage(userPayload);

    return {
      id: userPayload?.id ?? "",
      name: userPayload?.name ?? "",
      email: userPayload?.email ?? "",
      phone: userPayload?.phone ?? "",
      imageUrl,
    };
  },

  completeGoogleLogin: async (token: string): Promise<AuthSession> => {
    const user = await authService.getCurrentUser(token);
    setAuthCookie(token);
    try { apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`; } catch (e) {}
    return { token, user };
  },

  // Starts a pending signup. The backend must not create a User here; it only
  // sends a verification OTP and stores the pending signup securely server-side.
startEmailSignupVerification: async (details: SignupDetails) => {
    const response = await apiClient.post<string>(`/auth/sign-up/email`, details);
    return response.data;
  },

  startPhoneSignupVerification: async (details: SignupDetails) => {
    const response = await apiClient.post<SignupVerificationChallenge>(`/auth/signup/phone/verification`, details);
    return response.data;
  },

  // The backend validates the code and creates the account only on success.
  confirmEmailSignupVerification: async (verificationId: string, otp: string) => {
    const response = await apiClient.post<{ verified: boolean; message: string }>(`/auth/sign-up/email`, { verificationId, otp });
    return response.data;
  },

  confirmPhoneSignupVerification: async (verificationId: string, otp: string) => {
    const response = await apiClient.post<{ verified: boolean; message: string }>(`/auth/signup/phone/verification/confirm`, { verificationId, otp });
    return response.data;
  },

forgotPassword: async (_email: string) => {
    void _email;
    throw new Error("Not implemented yet");
  },
  
  // Updated verifyOtp to send email, phone, and code to match Spring Boot's OtpRequest DTO
  verifyOtp: async (email: string, phone: string, code: string): Promise<AuthSession> => {
    const response = await apiClient.post<Record<string, any>>(`/auth/verify-otp`, { email, phone, code });

    const token = extractAuthToken(response.data);
    const userPayload = response.data?.user ?? response.data;
    const imageUrl = extractUserImage(userPayload);

    if (token) {
      setAuthCookie(token);
      try { apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`; } catch (e) {}
    }

    return {
      token,
      user: {
        id: userPayload?.id ?? "",
        name: userPayload?.name ?? userPayload?.displayName ?? email.split("@")[0],
        email: userPayload?.email ?? email,
        phone: userPayload?.phone ?? phone,
        imageUrl,
      },
    };
  },
};
