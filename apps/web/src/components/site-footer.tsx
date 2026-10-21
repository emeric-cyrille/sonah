import Link from 'next/link';

export function SiteFooter(): JSX.Element {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="container-page flex flex-col gap-6 py-10 text-sm text-ink-500 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <p className="font-semibold text-ink-900">SONAH</p>
          <p className="mt-1">
            Système d&apos;Orientation Nationale et d&apos;Accompagnement Harmonisé. Les
            informations fournies sont indicatives : vérifiez toujours auprès de
            l&apos;administration concernée.
          </p>
        </div>
        <nav aria-label="Liens de pied de page">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li>
              <Link href="/demarches" className="hover:text-ink-900">
                Démarches
              </Link>
            </li>
            <li>
              <Link href="/droits" className="hover:text-ink-900">
                Mes droits
              </Link>
            </li>
            <li>
              <Link href="/chat" className="hover:text-ink-900">
                Assistant
              </Link>
            </li>
            <li>
              <a href="https://github.com/emeric-cyrille/sonah" className="hover:text-ink-900">
                Code source
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <div className="h-1 w-full bg-[linear-gradient(90deg,#007a5e_33.3%,#ce1126_33.3%_66.6%,#fcd116_66.6%)]" />
    </footer>
  );
}
