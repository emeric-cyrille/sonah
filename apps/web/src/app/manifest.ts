import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sonah — Assistant administratif',
    short_name: 'Sonah',
    description: 'Votre guide des démarches administratives au Cameroun',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6f1e7',
    theme_color: '#f6f1e7',
    lang: 'fr',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
