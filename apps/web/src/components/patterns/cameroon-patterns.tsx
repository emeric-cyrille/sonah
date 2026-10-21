/**
 * Motifs du patrimoine textile et architectural camerounais, dessinés en SVG :
 * - Ndop (Grassfields, Ouest et Nord-Ouest) : réserve indigo, losanges et chevrons blancs
 * - Toghu (Nord-Ouest) : velours noir brodé de triangles rouge, jaune et vert
 * - Perlage bamiléké (Ouest) : broderie de perles en losanges concentriques
 * - Teleuk mousgoum (Extrême-Nord) : nervures en V des cases-obus en terre
 *
 * Chaque motif est un <pattern> SVG : l'identifiant doit être unique dans la page.
 */

export type PatternName = 'ndop' | 'ndop-line' | 'toghu' | 'perles' | 'teleuk';

const COLORS = {
  indigo: '#1a2150',
  paper: '#f6f1e7',
  velvet: '#0d0b0a',
  gold: '#e8a317',
  red: '#b3261e',
  green: '#0f6b4f',
  blue: '#2b5cb8',
  clay: '#b5652e',
  clayLight: '#e2a26b',
  clayDark: '#6e3416',
} as const;

function NdopDefs({
  id,
  lineOnly = false,
  ink = COLORS.paper,
}: {
  id: string;
  lineOnly?: boolean;
  ink?: string;
}): JSX.Element {
  return (
    <pattern id={id} width="56" height="56" patternUnits="userSpaceOnUse">
      {!lineOnly && <rect width="56" height="56" fill={COLORS.indigo} />}
      <g fill="none" stroke={ink} strokeWidth="1.6">
        <path d="M0 14 L14 2 L28 14 L14 26Z" />
        <path d="M28 2 H56 M28 26 H56 M0 30 H28 M0 54 H28" />
        <path
          d="M31 8 l4 6 l4 -6 l4 6 l4 -6 l4 6 l4 -6 M31 20 l4 -6 l4 6 l4 -6 l4 6 l4 -6 l4 6"
          strokeWidth="1.4"
        />
        <path d="M28 42 L42 30 L56 42 L42 54Z" />
      </g>
      <g fill={ink}>
        <path d="M14 9 L19 14 L14 19 L9 14Z" />
        <circle cx="42" cy="42" r="3" />
        <path d="M3 36 h4 v4 h-4z M12 36 h4 v4 h-4z M21 36 h4 v4 h-4z M3 45 h4 v4 h-4z M12 45 h4 v4 h-4z M21 45 h4 v4 h-4z" />
      </g>
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

/** Losange de perles : couleur choisie selon la distance au centre de la tuile. */
const BEAD_RINGS = [COLORS.red, COLORS.gold, COLORS.green, COLORS.paper, COLORS.blue] as const;
const BEAD_GRID = 8;
const BEAD_STEP = 7;

function PerlesDefs({ id }: { id: string }): JSX.Element {
  const beads: JSX.Element[] = [];
  for (let row = 0; row < BEAD_GRID; row += 1) {
    for (let col = 0; col < BEAD_GRID; col += 1) {
      const distance = Math.abs(col - 3.5) + Math.abs(row - 3.5);
      const ring = Math.min(BEAD_RINGS.length - 1, Math.floor(distance / 1.5));
      beads.push(
        <circle
          key={`${row}-${col}`}
          cx={col * BEAD_STEP + BEAD_STEP / 2}
          cy={row * BEAD_STEP + BEAD_STEP / 2}
          r="2.6"
          fill={BEAD_RINGS[ring]}
        />,
      );
    }
  }
  const size = BEAD_GRID * BEAD_STEP;
  return (
    <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
      <rect width={size} height={size} fill={COLORS.velvet} />
      {beads}
    </pattern>
  );
}

function TeleukDefs({ id }: { id: string }): JSX.Element {
  const ridge = (x: number, y: number): JSX.Element => (
    <g key={`${x}-${y}`}>
      <path
        d={`M${x + 2} ${y + 11} L${x + 10} ${y + 4} L${x + 18} ${y + 11}`}
        fill="none"
        stroke={COLORS.clayDark}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d={`M${x + 2} ${y + 9} L${x + 10} ${y + 2} L${x + 18} ${y + 9}`}
        fill="none"
        stroke={COLORS.clayLight}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
  const ridges: JSX.Element[] = [];
  for (let y = 0; y < 48; y += 12) {
    ridges.push(ridge(0, y));
    ridges.push(ridge(20, (y + 6) % 48));
  }
  return (
    <pattern id={id} width="40" height="48" patternUnits="userSpaceOnUse">
      <rect width="40" height="48" fill={COLORS.clay} />
      {ridges}
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
    case 'ndop-line':
      return <NdopDefs id={id} lineOnly ink={ink} />;
    case 'toghu':
      return <ToghuDefs id={id} />;
    case 'perles':
      return <PerlesDefs id={id} />;
    case 'teleuk':
      return <TeleukDefs id={id} />;
  }
}

/** Remplit son conteneur avec un motif. */
export function PatternFill({
  name,
  id,
  className = 'h-full w-full',
  ink,
}: {
  readonly name: PatternName;
  readonly id: string;
  readonly className?: string;
  /** Couleur des traits pour `ndop-line` (motif en filigrane). */
  readonly ink?: string;
}): JSX.Element {
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
}> = [
  { name: 'ndop', label: 'Ndop', origin: 'Grassfields · Ouest' },
  { name: 'toghu', label: 'Toghu', origin: 'Nord-Ouest' },
  { name: 'perles', label: 'Perlage bamiléké', origin: 'Ouest' },
  { name: 'teleuk', label: 'Teleuk mousgoum', origin: 'Extrême-Nord' },
];
