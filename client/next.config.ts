import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Keep internal Next.js /api routes as default.
    // Enable external API proxy only when explicitly requested.
    const shouldProxyExternally = process.env.ENABLE_EXTERNAL_API_PROXY === "true";
    if (!shouldProxyExternally) return [];

    const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
    if (!apiOrigin) return [];

    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
