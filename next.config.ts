import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Optimizations for Vercel deployment
  output: 'standalone',
  experimental: {
    // Enable Turbopack for faster builds
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // Enable compression for better performance
  compress: true,
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
