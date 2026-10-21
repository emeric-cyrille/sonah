'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { useEffect, useRef, type ReactNode } from 'react';

gsap.registerPlugin(ScrollTrigger);

/**
 * Défilement fluide (Lenis) et animations liées au scroll (GSAP ScrollTrigger).
 *
 * Attributs reconnus dans les enfants :
 * - data-reveal           : apparition en fondu montant
 * - data-reveal-stagger   : apparition décalée des enfants directs
 * - data-parallax="<px>"  : translation horizontale liée au scroll
 * - data-scale-in         : zoom d'entrée
 */
export function ScrollMotion({ children }: { readonly children: ReactNode }): JSX.Element {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number): void => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
        gsap.from(element, {
          y: 48,
          opacity: 0,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 88%' },
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-reveal-stagger]').forEach((list) => {
        gsap.from(list.children, {
          y: 36,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: { trigger: list, start: 'top 85%' },
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((element) => {
        const distance = Number(element.dataset.parallax ?? '120');
        gsap.fromTo(
          element,
          { x: 0 },
          {
            x: -distance,
            ease: 'none',
            scrollTrigger: {
              trigger: element,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>('[data-scale-in]').forEach((element) => {
        gsap.from(element, {
          scale: 0.86,
          opacity: 0,
          rotateX: 12,
          transformPerspective: 1200,
          duration: 1.2,
          ease: 'expo.out',
          scrollTrigger: { trigger: element, start: 'top 85%' },
        });
      });
    }, root);

    return () => {
      ctx.revert();
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return <div ref={root}>{children}</div>;
}
