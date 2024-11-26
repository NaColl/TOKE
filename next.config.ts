// next.config.js
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@/components'], // Transpile components for TypeScript support
};

export default nextConfig;