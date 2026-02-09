import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/photos/:path*',
        destination: '/api/photos/:path*',
      },
    ]
  },
};

export default nextConfig;
