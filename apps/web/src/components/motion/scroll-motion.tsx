'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Animations d'apparition au scroll (GSAP ScrollTrigger), sur le défilement natif du navigateur.
 *
 * Attributs reconnus dans les enfants :
 * - data-reveal           : apparition en fondu montant
 * - data-reveal-stagger   : apparition décalée des enfants directs
 * - data-parallax="<px>"  : léger glissement horizontal lié au scroll
 */
export function ScrollMotion({ children }: { readonly children: ReactNode }): JSX.Element {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Enregistré après l'hydratation : ScrollTrigger modifie le style de <body> à l'enregistrement
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
        gsap.from(element, {
          y: 20,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: element, start: 'top 95%', once: true },
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-reveal-stagger]').forEach((list) => {
        gsap.from(list.children, {
          y: 16,
          opacity: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.05,
          scrollTrigger: { trigger: list, start: 'top 95%', once: true },
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((element) => {
        const distance = Number(element.dataset.parallax ?? '120');
        gsap.to(element, {
          x: -distance,
          ease: 'none',
          scrollTrigger: { trigger: element, start: 'top bottom', end: 'bottom top', scrub: 0.5 },
        });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return <div ref={root}>{children}</div>;
}
