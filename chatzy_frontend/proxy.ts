import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isExpired(token: string): boolean {
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized)) as { exp?: unknown };

    return typeof decoded.exp !== "number" || decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get("chatzy-auth-token")?.value;
  const expired = token ? isExpired(token) : true;
  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup") ||
    request.nextUrl.pathname.startsWith("/otp-verification") ||
    request.nextUrl.pathname.startsWith("/forgot-password") ||
    request.nextUrl.pathname.startsWith("/google-success");

  if (expired && !isAuthPage) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("chatzy-auth-token");
    return response;
  }

  if (expired) {
    const response = NextResponse.next();
    response.cookies.delete("chatzy-auth-token");
    return response;
  }

  if (isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
