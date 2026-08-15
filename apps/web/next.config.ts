import type { NextConfig } from "next";

const apiOrigin = process.env.API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  transpilePackages: ["@applyflow/design-tokens", "@applyflow/schemas", "@applyflow/ui-web"],
  async rewrites() {
    // Production/Railway: browsers call NEXT_PUBLIC_API_URL directly.
    if (process.env.NEXT_PUBLIC_API_URL) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
