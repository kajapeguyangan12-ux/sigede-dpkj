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
    'http://192.168.1.39:3000',
    'http://localhost:3000', 
    'http://127.0.0.1:3000',
    'https://192.168.1.39:3000',
    'https://localhost:3000',
    'https://127.0.0.1:3000',
  ],
};

export default nextConfig;
