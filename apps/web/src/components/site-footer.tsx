'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NdopBand } from './ndop-band';

export function SiteFooter(): JSX.Element | null {
  const pathname = usePathname();
  // La conversation occupe tout l'écran : pas de pied de page
  if (pathname.startsWith('/chat')) return null;

  return (
    <footer className="bg-ink text-paper/80">
      <NdopBand id="ndop-footer" className="h-6" />
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-3xl text-paper">Sonah</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-paper/60">
            Système d&apos;Orientation Nationale et d&apos;Accompagnement Harmonisé. Les réponses de
            Sonah sont indicatives : en cas de doute, l&apos;administration concernée fait foi.
          </p>
        </div>
        <nav aria-label="Pied de page">
          <p className="eyebrow text-paper/40">Explorer</p>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            <li>
              <Link href="/chat" className="hover:text-sun">
                Parler à Sonah
              </Link>
            </li>
            <li>
              <Link href="/demarches" className="hover:text-sun">
                Démarches
              </Link>
            </li>
            <li>
              <Link href="/#comment" className="hover:text-sun">
                Comment ça marche
              </Link>
            </li>
          </ul>
        </nav>
        <div>
          <p className="eyebrow text-paper/40">Projet</p>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            <li>
              <a href="https://github.com/emeric-cyrille/sonah" className="hover:text-sun">
                Code source
              </a>
            </li>
            <li>
              <a href="mailto:fokamemeric@gmail.com" className="hover:text-sun">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="container-page border-t border-paper/10 py-6 text-xs text-paper/40">
        Fait au Cameroun · {new Date().getFullYear()}
      </div>
    </footer>
  );
}
