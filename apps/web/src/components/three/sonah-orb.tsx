'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/i18n/provider';
import { OrbFallback } from './orb-fallback';
import type { SonahOrbSceneProps } from './sonah-orb-scene';

const SonahOrbScene = dynamic(() => import('./sonah-orb-scene'), {
  ssr: false,
  loading: () => <OrbFallback />,
});

const SMALL_SCREEN_QUERY = '(max-width: 639px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const SLOW_CONNECTIONS = new Set(['slow-2g', '2g', '3g']);

interface NetworkInformationLike {
  readonly saveData?: boolean;
  readonly effectiveType?: string;
  addEventListener?: (type: 'change', listener: () => void) => void;
  removeEventListener?: (type: 'change', listener: () => void) => void;
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function getConnection(): NetworkInformationLike | undefined {
  return (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
}

/**
 * La 3D est réservée aux appareils qui en profitent : on sert l'orbe CSS sur petit écran,
 * en mode économie de données, sur connexion lente ou quand l'utilisateur limite les animations.
 */
function shouldUseLiteOrb(): boolean {
  if (window.matchMedia(SMALL_SCREEN_QUERY).matches) return true;
  if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return true;
  const connection = getConnection();
  if (connection?.saveData) return true;
  if (connection?.effectiveType && SLOW_CONNECTIONS.has(connection.effectiveType)) return true;
  return !supportsWebGL();
}

interface SonahOrbProps extends Pick<SonahOrbSceneProps, 'energy' | 'compact'> {
  readonly className?: string;
}

/**
 * Sonah en 3D : orbe gravé de motifs ndop et toghu, anneaux brodés aux couleurs toghu et poussière d'or.
 * Charge three.js à la demande, se met en pause hors écran et respecte « mouvement réduit ».
 */
export function SonahOrb({ className, energy = 0, compact = false }: SonahOrbProps): JSX.Element {
  const { dict } = useI18n();
  const container = useRef<HTMLDivElement>(null);
  const [canRender, setCanRender] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  useEffect(() => {
    const evaluate = (): void => setCanRender(!shouldUseLiteOrb());
    evaluate();
    const queries = [SMALL_SCREEN_QUERY, REDUCED_MOTION_QUERY].map((query) =>
      window.matchMedia(query),
    );
    queries.forEach((media) => media.addEventListener('change', evaluate));
    const connection = getConnection();
    connection?.addEventListener?.('change', evaluate);
    return () => {
      queries.forEach((media) => media.removeEventListener('change', evaluate));
      connection?.removeEventListener?.('change', evaluate);
    };
  }, []);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry?.isIntersecting ?? true),
      { rootMargin: '100px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={container} className={className} role="img" aria-label={dict.orb.label}>
      {canRender ? (
        <SonahOrbScene energy={energy} compact={compact} animate={isVisible} />
      ) : (
        <OrbFallback />
      )}
    </div>
  );
}
