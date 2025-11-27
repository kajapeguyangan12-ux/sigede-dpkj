import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/v0/b/**',
      },
    ],
  },
  // Allow cross-origin requests from network IP during development
  allowedDevOrigins: [
    '192.168.1.39',
    '192.168.1.48',
    'localhost',
    '127.0.0.1',
  ],
};

export default nextConfig;
