import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  reactStrictMode: false,
  output: "standalone",
  experimental: {
    globalNotFound: true,
  },
};

export default nextConfig;
