/**
 * Motifs textiles africains dessinés en SVG :
 * - Ndop (Grassfields, Cameroun) : réserve indigo, losanges et chevrons blancs
 * - Toghu (Nord-Ouest et Ouest, Cameroun) : velours noir brodé de triangles colorés
 * - Kente (Ghana) : bandes tissées, blocs de rayures alternées
 * - Bogolan (Mali) : toile de boue, zigzags, cercles et points
 *
 * Chaque motif est un <pattern> SVG : l'identifiant doit être unique dans la page.
 */

export type PatternName = 'ndop' | 'toghu' | 'kente' | 'bogolan';

interface PatternProps {
  readonly id: string;
  readonly className?: string;
  /** Couleur de trait pour le bogolan utilisé en filigrane. */
  readonly ink?: string;
}

const COLORS = {
  indigo: '#1a2150',
  paper: '#f6f1e7',
  velvet: '#0d0b0a',
  gold: '#e8a317',
  red: '#b3261e',
  green: '#0f6b4f',
  earth: '#3b2416',
  cream: '#efe2c8',
} as const;

function NdopDefs({ id }: { id: string }): JSX.Element {
  return (
    <pattern id={id} width="56" height="56" patternUnits="userSpaceOnUse">
      <rect width="56" height="56" fill={COLORS.indigo} />
      <path d="M0 14 L14 2 L28 14 L14 26Z" fill="none" stroke={COLORS.paper} strokeWidth="1.6" />
      <path d="M14 9 L19 14 L14 19 L9 14Z" fill={COLORS.paper} />
      <path d="M28 2 H56 M28 26 H56" stroke={COLORS.paper} strokeWidth="1.6" />
      <path
        d="M31 8 l4 6 l4 -6 l4 6 l4 -6 l4 6 l4 -6 M31 20 l4 -6 l4 6 l4 -6 l4 6 l4 -6 l4 6"
        fill="none"
        stroke={COLORS.paper}
        strokeWidth="1.4"
      />
      <path d="M28 42 L42 30 L56 42 L42 54Z" fill="none" stroke={COLORS.paper} strokeWidth="1.6" />
      <circle cx="42" cy="42" r="3" fill={COLORS.paper} />
      <path d="M0 30 H28 M0 54 H28" stroke={COLORS.paper} strokeWidth="1.6" />
      <path
        d="M3 36 h4 v4 h-4z M12 36 h4 v4 h-4z M21 36 h4 v4 h-4z M3 45 h4 v4 h-4z M12 45 h4 v4 h-4z M21 45 h4 v4 h-4z"
        fill={COLORS.paper}
      />
    </pattern>
  );
}

function ToghuDefs({ id }: { id: string }): JSX.Element {
  return (
    <pattern id={id} width="72" height="40" patternUnits="userSpaceOnUse">
      <rect width="72" height="40" fill={COLORS.velvet} />
      <path d="M0 0 L12 12 L24 0Z" fill={COLORS.red} />
      <path d="M24 0 L36 12 L48 0Z" fill={COLORS.gold} />
      <path d="M48 0 L60 12 L72 0Z" fill={COLORS.green} />
      <path
        d="M0 20 l6 -4 l6 4 l6 -4 l6 4 l6 -4 l6 4 l6 -4 l6 4 l6 -4 l6 4 l6 -4 l6 4"
        fill="none"
        stroke={COLORS.paper}
        strokeWidth="1.6"
      />
      <path d="M0 40 L12 28 L24 40Z" fill={COLORS.gold} />
      <path d="M24 40 L36 28 L48 40Z" fill={COLORS.green} />
      <path d="M48 40 L60 28 L72 40Z" fill={COLORS.red} />
      <circle cx="12" cy="20" r="1.6" fill={COLORS.gold} />
      <circle cx="36" cy="20" r="1.6" fill={COLORS.red} />
      <circle cx="60" cy="20" r="1.6" fill={COLORS.green} />
    </pattern>
  );
}

function KenteDefs({ id }: { id: string }): JSX.Element {
  const verticals = [3, 11, 19, 27, 35, 43];
  return (
    <pattern id={id} width="104" height="40" patternUnits="userSpaceOnUse">
      {/* Bloc 1 : fond or, rayures verticales */}
      <rect width="52" height="40" fill={COLORS.gold} />
      {verticals.map((x, index) => (
        <rect
          key={x}
          x={x}
          y="6"
          width="4"
          height="28"
          fill={index % 2 === 0 ? COLORS.green : COLORS.red}
        />
      ))}
      <rect y="2" width="52" height="2.5" fill={COLORS.velvet} />
      <rect y="35.5" width="52" height="2.5" fill={COLORS.velvet} />
      {/* Bloc 2 : fond vert, rayures horizontales et losange */}
      <rect x="52" width="52" height="40" fill={COLORS.green} />
      <rect x="52" y="5" width="52" height="4" fill={COLORS.gold} />
      <rect x="52" y="12" width="52" height="2.5" fill={COLORS.red} />
      <rect x="52" y="25.5" width="52" height="2.5" fill={COLORS.red} />
      <rect x="52" y="31" width="52" height="4" fill={COLORS.gold} />
      <path
        d="M78 14 L84 20 L78 26 L72 20Z"
        fill={COLORS.gold}
        stroke={COLORS.velvet}
        strokeWidth="1.2"
      />
      <rect x="51" width="2" height="40" fill={COLORS.velvet} />
      <rect x="103" width="1" height="40" fill={COLORS.velvet} />
    </pattern>
  );
}

function BogolanDefs({ id, ink = COLORS.cream }: { id: string; ink?: string }): JSX.Element {
  return (
    <pattern id={id} width="80" height="80" patternUnits="userSpaceOnUse">
      <g fill="none" stroke={ink} strokeWidth="1.8" strokeLinecap="round">
        <circle cx="20" cy="20" r="9" />
        <circle cx="20" cy="20" r="3.5" fill={ink} />
        <path d="M0 40 l6.7 -6 l6.7 6 l6.7 -6 l6.7 6 l6.7 -6 l6.7 6 l6.7 -6 l6.7 6 l6.7 -6 l6.7 6 l6.7 -6 l6.7 6" />
        <path d="M54 54 l12 12 M66 54 l-12 12" />
        <path d="M46 8 h28 M46 32 h28" />
        <path d="M8 56 v20 M16 56 v20 M24 56 v20 M32 56 v20" />
      </g>
      <g fill={ink}>
        <circle cx="50" cy="20" r="2" />
        <circle cx="60" cy="20" r="2" />
        <circle cx="70" cy="20" r="2" />
        <circle cx="60" cy="48" r="1.6" />
        <circle cx="60" cy="72" r="1.6" />
        <circle cx="48" cy="60" r="1.6" />
        <circle cx="72" cy="60" r="1.6" />
      </g>
    </pattern>
  );
}

function PatternDefs({
  name,
  id,
  ink,
}: {
  name: PatternName;
  id: string;
  ink?: string;
}): JSX.Element {
  switch (name) {
    case 'ndop':
      return <NdopDefs id={id} />;
    case 'toghu':
      return <ToghuDefs id={id} />;
    case 'kente':
      return <KenteDefs id={id} />;
    case 'bogolan':
      return <BogolanDefs id={id} ink={ink} />;
  }
}

/** Remplit son conteneur avec un motif. */
export function PatternFill({
  name,
  id,
  className = 'h-full w-full',
  ink,
}: PatternProps & { readonly name: PatternName }): JSX.Element {
  return (
    <svg className={`block ${className}`} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <PatternDefs name={name} id={id} ink={ink} />
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

export const PATTERN_SWATCHES: ReadonlyArray<{
  readonly name: PatternName;
  readonly label: string;
  readonly origin: string;
  readonly background?: string;
}> = [
  { name: 'ndop', label: 'Ndop', origin: 'Grassfields, Cameroun' },
  { name: 'kente', label: 'Kente', origin: 'Ghana' },
  { name: 'toghu', label: 'Toghu', origin: 'Nord-Ouest, Cameroun' },
  { name: 'bogolan', label: 'Bogolan', origin: 'Mali', background: COLORS.earth },
];
