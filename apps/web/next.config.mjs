/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  allowedDevOrigins: ["127.0.0.1", "localhost"],
}

export default nextConfig
