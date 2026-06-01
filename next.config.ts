import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Vercel uses its own deployment format - do NOT use output: "standalone" */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
};

export default nextConfig;
