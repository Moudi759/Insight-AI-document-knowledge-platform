import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "mammoth", "bcryptjs"],
  eslint: {
    dirs: ["src"],
  },
};

export default nextConfig;
