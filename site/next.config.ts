import type { NextConfig } from "next";

// URL de l'API utilisée côté serveur Next (rewrites + fetch SSR).
// En Docker : http://api:3333 (réseau interne). Par défaut : l'API publique.
const API_BACKEND_URL = process.env.API_BACKEND_URL || "https://api.chezprecious.com";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["192.168.1.79"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      // Images produit servies par l'API AdonisJS (APP_URL)
      { protocol: "https", hostname: "api.chezprecious.com", pathname: "/uploads/**" },
      { protocol: "http",  hostname: "192.168.1.79", port: "3333", pathname: "/uploads/**" },
      { protocol: "http",  hostname: "localhost",    port: "3333", pathname: "/uploads/**" },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api-backend/:path*',
        destination: `${API_BACKEND_URL}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${API_BACKEND_URL}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
