import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sonah.fokamemeric.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'SONAH — Votre guide des démarches administratives au Cameroun',
    template: '%s · SONAH',
  },
  description:
    "SONAH vous oriente dans vos démarches administratives au Cameroun : création d'entreprise, état civil, pièces d'identité, impôts et droits constitutionnels.",
  icons: { icon: '/icon.svg' },
  openGraph: {
    type: 'website',
    locale: 'fr_CM',
    siteName: 'SONAH',
    url: SITE_URL,
  },
};

export const viewport: Viewport = {
  themeColor: '#007a5e',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
