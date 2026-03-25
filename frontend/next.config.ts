import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", 
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },

  async redirects() {
    return [
      {
        source: "/",
        destination: "/filmes",
        permanent: true,
      },
    ];
  },

  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
