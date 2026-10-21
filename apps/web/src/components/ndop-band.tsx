interface NdopBandProps {
  readonly id: string;
  readonly className?: string;
}

/**
 * Bande décorative inspirée du ndop, le tissu indigo des Grassfields de l'Ouest Cameroun.
 */
export function NdopBand({ id, className = 'h-7' }: NdopBandProps): JSX.Element {
  return (
    <svg className={`block w-full ${className}`} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="56" height="28" patternUnits="userSpaceOnUse">
          <rect width="56" height="28" fill="#1a2150" />
          <path d="M0 14 L14 2 L28 14 L14 26Z" fill="none" stroke="#f6f1e7" strokeWidth="1.6" />
          <path d="M14 9 L19 14 L14 19 L9 14Z" fill="#f6f1e7" />
          <path d="M28 2 L56 2 M28 26 L56 26" stroke="#f6f1e7" strokeWidth="1.6" />
          <path
            d="M33 8 l4 6 l4 -6 l4 6 l4 -6 M33 20 l4 -6 l4 6 l4 -6 l4 6"
            fill="none"
            stroke="#f6f1e7"
            strokeWidth="1.4"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
