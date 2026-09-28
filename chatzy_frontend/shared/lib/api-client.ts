import axios from "axios";

// Build base URL. Prefer NEXT_PUBLIC_API_BASE_URL; fallback to NEXT_PUBLIC_API_URL
// which may be provided without the `/api` suffix.
const apiBaseFromUrl = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api`
  : undefined;

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? apiBaseFromUrl ?? "http://localhost:8080/api";

export const apiClient = axios.create({
  baseURL,
  timeout: 12_000,
  headers: {
    "Content-Type": "application/json",
  },
  // Send cookies/credentials for cross-origin auth flows when needed.
  withCredentials: true,
});

// If a token cookie exists in the browser, set the Authorization header on the client.
if (typeof document !== "undefined") {
  try {
    const match = document.cookie.match(/(?:^|; )chatzy-auth-token=([^;]+)/);
    if (match && match[1]) {
      const token = decodeURIComponent(match[1]);
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
}

export type ApiResult<T> = {
  data: T;
  message: string;
};

export function mockRequest<T>(data: T, message = "Request completed") {
  return new Promise<ApiResult<T>>((resolve) => {
    window.setTimeout(() => resolve({ data, message }), 650);
  });
}
