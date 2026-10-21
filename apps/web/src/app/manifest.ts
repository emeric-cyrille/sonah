import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SONAH — Démarches administratives',
    short_name: 'SONAH',
    description: 'Votre guide des démarches administratives au Cameroun',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#007a5e',
    lang: 'fr',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
