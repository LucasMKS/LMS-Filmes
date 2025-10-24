import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: "standalone",

  // Image optimization configuration
  images: {
    domains: ["image.tmdb.org", "www.themoviedb.org"],
    unoptimized: process.env.NODE_ENV === "development",
  },

  // Experimental features
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
