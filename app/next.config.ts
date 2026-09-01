import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'photos.smalltown.gallery' },
    ],
    // Photo files are content-stable; cache optimized variants for 31 days
    minimumCacheTTL: 2678400,
  },
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
