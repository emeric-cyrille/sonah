import type { MetadataRoute } from 'next';
import { getServerDictionary } from '@/i18n/server';

export default function manifest(): MetadataRoute.Manifest {
  const { dict, locale } = getServerDictionary();
  return {
    name: dict.meta.manifestName,
    short_name: 'Sonah',
    description: dict.meta.manifestDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#f6f1e7',
    theme_color: '#0b0d22',
    lang: locale,
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
