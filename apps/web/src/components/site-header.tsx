'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Logo } from './logo';

const NAV_LINKS = [
  { href: '/demarches', label: 'Démarches' },
  { href: '/#comment', label: 'Comment ça marche' },
] as const;

export function SiteHeader(): JSX.Element {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const isChat = pathname.startsWith('/chat');

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-night/[0.94] text-paper backdrop-blur-xl">
      <div className="container-page flex h-[68px] items-center justify-between">
        <Link href="/" className="group flex items-center gap-2.5" onClick={() => setIsOpen(false)}>
          <Logo className="h-9 w-9 transition-transform duration-500 group-hover:rotate-45" />
          <span className="font-display text-[22px] font-semibold tracking-tight">Sonah</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Navigation principale">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? 'page' : undefined}
              className="text-[15px] font-medium text-paper/70 transition-colors hover:text-paper aria-[current=page]:text-sun"
            >
              {link.label}
            </Link>
          ))}
          {!isChat && (
            <Link href="/chat" className="btn-sun px-5 py-2.5 text-sm">
              Parler à Sonah
            </Link>
          )}
        </nav>

        <button
          type="button"
          className="-mr-2 flex h-11 w-11 flex-col items-center justify-center gap-1.5 md:hidden"
          aria-expanded={isOpen}
          aria-controls="mobile-nav"
          aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span
            className={`h-0.5 w-6 rounded bg-paper transition-transform duration-200 ${isOpen ? 'translate-y-1 rotate-45' : ''}`}
          />
          <span
            className={`h-0.5 w-6 rounded bg-paper transition-transform duration-200 ${isOpen ? '-translate-y-1 -rotate-45' : ''}`}
          />
        </button>
      </div>

      {isOpen && (
        <nav
          id="mobile-nav"
          className="border-t border-white/10 md:hidden"
          aria-label="Navigation mobile"
        >
          <ul className="container-page flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block py-3 font-display text-2xl"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="pt-3">
              <Link href="/chat" className="btn-sun w-full" onClick={() => setIsOpen(false)}>
                Parler à Sonah
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
