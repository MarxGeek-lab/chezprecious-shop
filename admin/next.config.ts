import type { NextConfig } from "next";

// URL de l'API utilisée par les rewrites Next.
// En Docker : http://api:3333 (réseau interne). Par défaut : l'API publique.
const API_BACKEND_URL = process.env.API_BACKEND_URL || 'https://api.chezprecious.com';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api-backend/:path*',
        destination: `${API_BACKEND_URL}/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${API_BACKEND_URL}/uploads/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      // Images produits uploadées (API locale ou S3)
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: 'api.chezprecious.com', pathname: '/uploads/**' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
      // Unsplash (photos de démo / placeholder)
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Avatars / logos
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

export default nextConfig;
