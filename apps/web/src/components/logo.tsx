/** Marque Sonah : un orbe indigo frappé d'un losange ndop doré. */
export function Logo({ className = 'h-9 w-9' }: { className?: string }): JSX.Element {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="logo-orb" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#3b4aa0" />
          <stop offset="60%" stopColor="#1a2150" />
          <stop offset="100%" stopColor="#0b0e2a" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="url(#logo-orb)" />
      <circle cx="20" cy="20" r="18" fill="none" stroke="#e8a317" strokeWidth="1.4" />
      <path d="M20 8 L32 20 L20 32 L8 20Z" fill="none" stroke="#e8a317" strokeWidth="1.6" />
      <path d="M20 14 L26 20 L20 26 L14 20Z" fill="#e8a317" />
      <circle cx="20" cy="20" r="1.8" fill="#1a2150" />
    </svg>
  );
}
