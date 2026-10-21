import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const API_PROXY_URL = process.env.API_PROXY_URL || 'http://localhost:4000';

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
  experimental: {
    // Monorepo : trace les dépendances depuis la racine pour le build standalone
    outputFileTracingRoot: path.join(path.dirname(fileURLToPath(import.meta.url)), '../../'),
  },
  // En production, Traefik route /api/v1 vers l'API avant d'atteindre Next.js.
  // En développement, Next.js relaie ces requêtes vers l'API locale.
  async rewrites() {
    return [{ source: '/api/v1/:path*', destination: `${API_PROXY_URL}/api/v1/:path*` }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
