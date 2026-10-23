'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/provider';
import { LanguageToggle } from './language-toggle';
import { Logo } from './logo';

export function SiteHeader(): JSX.Element {
  const pathname = usePathname();
  const { dict } = useI18n();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const isChat = pathname.startsWith('/chat');

  const links = [
    { href: '/demarches', label: dict.header.links.topics },
    { href: '/lab', label: dict.header.links.lab },
    { href: '/audit', label: dict.header.links.audit },
    { href: '/about', label: dict.header.links.about },
  ];

  // Ferme le menu mobile à chaque changement de page
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const isCurrent = (href: string): boolean => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-night/[0.94] text-paper backdrop-blur-xl">
      <div className="container-page flex h-[68px] items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <Logo className="h-9 w-9 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105" />
          <span className="font-display text-[22px] font-semibold tracking-tight">Sonah</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label={dict.header.mainNav}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isCurrent(link.href) ? 'page' : undefined}
              className="text-[15px] font-medium text-paper/80 transition-colors hover:text-paper aria-[current=page]:text-sun"
            >
              {link.label}
            </Link>
          ))}
          <LanguageToggle />
          {!isChat && (
            <Link href="/chat" className="btn-sun px-5 py-2.5 text-sm">
              {dict.header.cta}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageToggle />
          <button
            type="button"
            className="-mr-2 flex h-11 w-11 flex-col items-center justify-center gap-1.5"
            aria-expanded={isOpen}
            aria-controls="mobile-nav"
            aria-label={isOpen ? dict.header.closeMenu : dict.header.openMenu}
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
      </div>

      {isOpen && (
        <nav
          id="mobile-nav"
          className="border-t border-white/10 lg:hidden"
          aria-label={dict.header.mobileNav}
        >
          <ul className="container-page flex flex-col gap-1 py-4">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isCurrent(link.href) ? 'page' : undefined}
                  className="block py-3 font-display text-2xl aria-[current=page]:text-sun"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="pt-3">
              <Link href="/chat" className="btn-sun w-full" onClick={() => setIsOpen(false)}>
                {dict.header.cta}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
