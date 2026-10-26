import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backend = process.env.BACKEND_ORIGIN ?? "http://localhost:8080";
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/backend/:path*", destination: `${backend}/:path*` },
      { source: "/ws-chat/:path*", destination: `${backend}/ws-chat/:path*` },
      { source: "/oauth2/:path*", destination: `${backend}/oauth2/:path*` },
      { source: "/login/:path*", destination: `${backend}/login/:path*` },
    ];
  },
};

export default nextConfig;
