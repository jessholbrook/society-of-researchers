import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // In production, NEXT_PUBLIC_API_URL makes all API calls go directly
  // to the backend (CORS enabled). Rewrites only needed for local dev
  // where the env var isn't set.
  async rewrites() {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
