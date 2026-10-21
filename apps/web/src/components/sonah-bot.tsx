interface SonahBotProps {
  readonly className?: string;
  /** Anime le robot (coucou, clignement, flottement). */
  readonly animated?: boolean;
  readonly title?: string;
}

/**
 * Illustration de Sonah : un petit robot au col en motif ndop, l'étoile du drapeau en antenne,
 * qui fait coucou de la main droite.
 */
export function SonahBot({
  className,
  animated = true,
  title = 'Sonah, votre assistant, vous fait coucou',
}: SonahBotProps): JSX.Element {
  const anim = (name: string): string | undefined => (animated ? name : undefined);

  return (
    <svg viewBox="0 0 300 340" className={className} role="img" aria-label={title}>
      <ellipse cx="150" cy="324" rx="74" ry="9" fill="#181b34" opacity="0.1" />

      <g className={anim('bot-float')}>
        {/* Bras gauche, au repos */}
        <g>
          <rect
            x="68"
            y="200"
            width="26"
            height="66"
            rx="13"
            fill="#0f6b4f"
            transform="rotate(14 81 206)"
          />
          <circle cx="68" cy="266" r="15" fill="#fbf8f2" stroke="#181b34" strokeWidth="3.5" />
        </g>

        {/* Bras droit, qui fait coucou */}
        <g className={anim('bot-arm')}>
          <rect
            x="206"
            y="134"
            width="26"
            height="80"
            rx="13"
            fill="#0f6b4f"
            transform="rotate(20 219 210)"
          />
          <circle cx="245" cy="134" r="17" fill="#fbf8f2" stroke="#181b34" strokeWidth="3.5" />
          <path
            d="M236 122 q-2 -10 6 -12"
            fill="none"
            stroke="#181b34"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M261 122 q6 -6 12 -2"
            fill="none"
            stroke="#e8a317"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M266 136 q8 0 11 5"
            fill="none"
            stroke="#e8a317"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>

        {/* Jambes */}
        <rect x="116" y="278" width="24" height="32" rx="11" fill="#181b34" />
        <rect x="160" y="278" width="24" height="32" rx="11" fill="#181b34" />

        {/* Corps */}
        <rect x="88" y="178" width="124" height="114" rx="42" fill="#0f6b4f" />
        <rect x="111" y="204" width="78" height="58" rx="20" fill="#fbf8f2" />
        <path
          d="M121 238 l9.5 -10 l9.5 10 l9.5 -10 l9.5 10 l9.5 -10 l9.5 10"
          fill="none"
          stroke="#26306b"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="150" cy="250" r="3.5" fill="#c4532d" />

        {/* Col ndop */}
        <rect x="120" y="170" width="60" height="16" rx="8" fill="#26306b" />
        <path
          d="M128 178 l5 -4 l5 4 l-5 4z M145 178 l5 -4 l5 4 l-5 4z M162 178 l5 -4 l5 4 l-5 4z"
          fill="#fbf8f2"
        />

        {/* Oreilles */}
        <rect x="56" y="100" width="18" height="40" rx="9" fill="#0f6b4f" />
        <rect x="226" y="100" width="18" height="40" rx="9" fill="#0f6b4f" />

        {/* Antenne et étoile */}
        <line
          x1="150"
          y1="62"
          x2="150"
          y2="36"
          stroke="#181b34"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <polygon
          className={anim('bot-star')}
          points="150,12 153.5,21.2 163.3,21.7 155.7,27.9 158.2,37.3 150,32 141.8,37.3 144.3,27.9 136.7,21.7 146.5,21.2"
          fill="#e8a317"
          stroke="#181b34"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Tête */}
        <rect
          x="68"
          y="58"
          width="164"
          height="120"
          rx="48"
          fill="#fbf8f2"
          stroke="#181b34"
          strokeWidth="4"
        />
        <rect x="90" y="80" width="120" height="76" rx="30" fill="#181b34" />
        <g className={anim('bot-eyes')}>
          <rect x="117" y="102" width="16" height="25" rx="8" fill="#e8a317" />
          <rect x="167" y="102" width="16" height="25" rx="8" fill="#e8a317" />
        </g>
        <path
          d="M134 136 q16 13 32 0"
          fill="none"
          stroke="#e8a317"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx="108" cy="134" r="6" fill="#c4532d" opacity="0.85" />
        <circle cx="192" cy="134" r="6" fill="#c4532d" opacity="0.85" />
        <path
          d="M96 74 q8 -6 18 -6"
          fill="none"
          stroke="#e0d6c2"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
