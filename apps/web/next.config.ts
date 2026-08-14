import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@applyflow/design-tokens", "@applyflow/schemas"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
