'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { OrbFallback } from './orb-fallback';
import type { SonahOrbSceneProps } from './sonah-orb-scene';

const SonahOrbScene = dynamic(() => import('./sonah-orb-scene'), {
  ssr: false,
  loading: () => <OrbFallback />,
});

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

interface SonahOrbProps extends Pick<SonahOrbSceneProps, 'energy' | 'compact'> {
  readonly className?: string;
}

/**
 * Sonah en 3D : orbe gravé de motifs ndop et toghu, anneaux brodés aux couleurs toghu et poussière d'or.
 * Charge three.js à la demande, se met en pause hors écran et respecte « mouvement réduit ».
 */
export function SonahOrb({ className, energy = 0, compact = false }: SonahOrbProps): JSX.Element {
  const container = useRef<HTMLDivElement>(null);
  const [canRender, setCanRender] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    setCanRender(supportsWebGL());
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
    const onChange = (event: MediaQueryListEvent): void => setReducedMotion(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry?.isIntersecting ?? true),
      {
        rootMargin: '100px',
      },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={container} className={className} role="img" aria-label="Sonah, votre assistant">
      {canRender ? (
        <SonahOrbScene energy={energy} compact={compact} animate={isVisible && !reducedMotion} />
      ) : (
        <OrbFallback />
      )}
    </div>
  );
}
