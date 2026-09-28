import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the development server to be accessed from the LAN IP for HMR and dev assets
  // `allowedDevOrigins` expects host names, not full URL origins.
  allowedDevOrigins: [
    '192.168.1.35',
  ],
  // Keep browser requests on the same HTTPS origin. Next forwards them to the
  // local Spring Boot server, avoiding mixed-content blocks on mobile devices.
  async rewrites() {
    const backendOrigin = process.env.BACKEND_ORIGIN ?? "http://192.168.1.35:8080";

    return [
      { source: "/api/:path*", destination: `${backendOrigin}/api/:path*` },
      { source: "/backend/:path*", destination: `${backendOrigin}/:path*` },
      { source: "/ws-chat/:path*", destination: `${backendOrigin}/ws-chat/:path*` },
    ];
  },
};

export default nextConfig;
