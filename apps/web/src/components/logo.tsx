/**
 * Marque Sonah : une bulle de dialogue (l'assistant) frappée d'un losange ndop doré,
 * bordée de triangles toghu aux couleurs du drapeau.
 */
export function Logo({ className = 'h-9 w-9' }: { className?: string }): JSX.Element {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="logo-bubble" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2f3a85" />
          <stop offset="100%" stopColor="#141a45" />
        </linearGradient>
        <clipPath id="logo-clip">
          <rect x="3" y="3" width="34" height="27" rx="9" />
        </clipPath>
      </defs>
      <path
        d="M11 28 L9.5 37 L19 29Z"
        fill="#141a45"
        stroke="#e8a317"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <rect x="3" y="3" width="34" height="27" rx="9" fill="url(#logo-bubble)" />
      <g clipPath="url(#logo-clip)">
        <path d="M3 30 L7 25 L11 30Z" fill="#b3261e" />
        <path d="M11 30 L15 25 L19 30Z" fill="#e8a317" />
        <path d="M19 30 L23 25 L27 30Z" fill="#0f6b4f" />
        <path d="M27 30 L31 25 L35 30Z" fill="#b3261e" />
        <path d="M35 30 L39 25 L43 30Z" fill="#e8a317" />
      </g>
      <rect
        x="3"
        y="3"
        width="34"
        height="27"
        rx="9"
        fill="none"
        stroke="#e8a317"
        strokeWidth="1.3"
      />
      <path
        d="M20 7 L27.5 14.5 L20 22 L12.5 14.5Z"
        fill="none"
        stroke="#e8a317"
        strokeWidth="1.5"
      />
      <path d="M20 11 L23.5 14.5 L20 18 L16.5 14.5Z" fill="#e8a317" />
    </svg>
  );
}
