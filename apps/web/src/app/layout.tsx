import type { Metadata, Viewport } from 'next';
import { Fraunces, Hanken_Grotesk } from 'next/font/google';
import type { ReactNode } from 'react';
import { MockBanner } from '@/components/mock-banner';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { I18nProvider } from '@/i18n/provider';
import { getServerDictionary } from '@/i18n/server';
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

export function generateMetadata(): Metadata {
  const { dict, locale } = getServerDictionary();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: dict.meta.title, template: '%s · Sonah' },
    description: dict.meta.description,
    icons: { icon: '/icon.svg' },
    openGraph: {
      type: 'website',
      locale: dict.meta.ogLocale,
      alternateLocale: locale === 'fr' ? 'en_CM' : 'fr_CM',
      siteName: 'Sonah',
      url: SITE_URL,
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#0b0d22',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  const { dict, locale } = getServerDictionary();
  return (
    <html lang={locale} className={`${display.variable} ${sans.variable}`}>
      <body className="flex min-h-screen flex-col">
        <I18nProvider initialLocale={locale}>
          <a
            href="#contenu"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
          >
            {dict.common.skipToContent}
          </a>
          <SiteHeader />
          <MockBanner />
          <div id="contenu" className="flex flex-1 flex-col">
            {children}
          </div>
          <SiteFooter />
        </I18nProvider>
      </body>
    </html>
  );
}
