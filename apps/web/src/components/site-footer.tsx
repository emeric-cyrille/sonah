'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/i18n/provider';
import { Logo } from './logo';
import { PatternFill } from './patterns/cameroon-patterns';

const GITHUB_URL = 'https://github.com/emeric-cyrille/sonah';

export function SiteFooter(): JSX.Element | null {
  const pathname = usePathname();
  const { dict } = useI18n();
  // La conversation occupe tout l'écran : pas de pied de page
  if (pathname.startsWith('/chat')) return null;

  const explore = [
    { href: '/chat', label: dict.footer.links.chat },
    { href: '/demarches', label: dict.footer.links.topics },
    { href: '/#comment', label: dict.footer.links.how },
    { href: '/lab', label: dict.footer.links.lab },
    { href: '/audit', label: dict.footer.links.audit },
  ];

  return (
    <footer className="bg-velvet text-paper/85">
      <PatternFill name="toghu" id="toghu-footer" className="h-10 w-full" />
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <Logo className="h-10 w-10" />
            <p className="font-display text-3xl text-paper">Sonah</p>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper/75">
            {dict.footer.tagline}
          </p>
        </div>
        <nav aria-label={dict.footer.footerNav}>
          <p className="eyebrow text-paper/70">{dict.footer.explore}</p>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            {explore.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-sun">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="eyebrow text-paper/70">{dict.footer.project}</p>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            <li>
              <Link href="/about" className="hover:text-sun">
                {dict.footer.links.about}
              </Link>
            </li>
            <li>
              <Link href="/about#confidentialite" className="hover:text-sun">
                {dict.footer.links.privacy}
              </Link>
            </li>
            <li>
              <a href={GITHUB_URL} className="hover:text-sun">
                {dict.footer.links.source}
              </a>
            </li>
            <li>
              <a href="mailto:fokamemeric@gmail.com" className="hover:text-sun">
                {dict.footer.links.contact}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="container-page flex flex-col gap-2 border-t border-paper/10 py-6 text-xs text-paper/70 sm:flex-row sm:justify-between">
        <span>
          {dict.footer.madeIn} · {dict.footer.prototype} · {new Date().getFullYear()}
        </span>
        <span>{dict.footer.motifs}</span>
      </div>
    </footer>
  );
}
