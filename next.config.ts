// /next.config.ts
// Next.js Configuration for GALLA.GOLD Application (TypeScript version)
// This file configures Next.js behavior, internationalization, and optimizations

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // =============================================================================
  // COMPILER OPTIONS
  // =============================================================================
  compiler: {
    // Remove console.log in production for cleaner logs
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // =============================================================================
  // IMAGE OPTIMIZATION
  // =============================================================================
  images: {
    // Allowed image domains for next/image optimization
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.gallagold.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // For user uploaded images (KYC, profile pics)
      },
    ],
    // Supported image formats
    formats: ['image/avif', 'image/webp'],
  },

  // =============================================================================
  // HEADERS & SECURITY
  // =============================================================================
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
        ],
      },
    ];
  },

  // =============================================================================
  // REDIRECTS
  // =============================================================================
  async redirects() {
    return [
      // Redirect old routes to new structure if needed
      {
        source: '/auth',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/auth/login',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/auth/signup',
        destination: '/signup',
        permanent: true,
      },
    ];
  },

  // =============================================================================
  // EXPERIMENTAL FEATURES
  // =============================================================================
  experimental: {
    // Enable server actions (required for form handling)
    serverActions: {
      bodySizeLimit: '2mb', // Limit for file uploads
      allowedOrigins: ['localhost:3000', '*.gallagold.com'],
    },
    // Optimize server component rendering
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },

  // =============================================================================
  // PRODUCTION OPTIMIZATIONS
  // =============================================================================
  // Compress responses with gzip/brotli
  compress: true,
  
  // Power by header (disable for security)
  poweredByHeader: false,
  
  // Strict mode for React (helps catch bugs)
  reactStrictMode: true,
  
  // Static page generation timeout
  staticPageGenerationTimeout: 120,
};

export default nextConfig;
