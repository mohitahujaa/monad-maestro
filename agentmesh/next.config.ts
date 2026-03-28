import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep ethers.js on the server side only (prevents client-bundle issues)
  serverExternalPackages: ["ethers"],

  // Allow large API response sizes for long-running task outputs
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
