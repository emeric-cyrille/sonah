import type { Metadata, Viewport } from 'next';
import { Fraunces, Hanken_Grotesk } from 'next/font/google';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import './globals.css';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  axes: ['SOFT', 'opsz'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const sans = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sonah.fokamemeric.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Sonah — votre assistant pour les démarches administratives au Cameroun',
    template: '%s · Sonah',
  },
  description:
    "Posez votre question à Sonah : création d'entreprise, pièces d'identité, état civil, impôts, droits du travail. Un seul assistant, gratuit, pour s'y retrouver dans l'administration camerounaise.",
  icons: { icon: '/icon.svg' },
  openGraph: {
    type: 'website',
    locale: 'fr_CM',
    siteName: 'Sonah',
    url: SITE_URL,
  },
};

export const viewport: Viewport = {
  themeColor: '#f6f1e7',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="fr" className={`${display.variable} ${sans.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          Aller au contenu
        </a>
        <SiteHeader />
        <div id="contenu" className="flex flex-1 flex-col">
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
