import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SONAH - Système d\'Orientation Nationale et d\'Accompagnement Harmonisé',
  description: 'Intelligence Artificielle Multi-Agents pour l\'Administration Camerounaise',
  manifest: '/manifest.json',
  themeColor: '#1E40AF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
