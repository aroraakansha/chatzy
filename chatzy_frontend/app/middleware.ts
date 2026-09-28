// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check for the auth token cookie set by your backend during login
  const token = request.cookies.get("chatzy-auth-token")?.value;
  const pathname = request.nextUrl.pathname;
  const isAuthPage =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/otp-verification") ||
    pathname.startsWith("/forgot-password");

  // If there is no token and the user tries to access protected pages, redirect to login
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If the user is logged in and tries to access auth pages or root, redirect to dashboard
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files, image optimizations, and favicon
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};