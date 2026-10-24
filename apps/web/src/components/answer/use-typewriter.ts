'use client';

import { useEffect, useRef, useState } from 'react';

/** Intervalle entre deux révélations (ms). */
const TICK_MS = 30;
/** Durée visée pour révéler une réponse, quelle que soit sa longueur (ms). */
const TARGET_DURATION_MS = 2600;
/** Nombre de mots révélés à chaque intervalle, au minimum. */
const MIN_WORDS_PER_TICK = 1;

/**
 * Coupe le texte après `count` mots en conservant les espaces et retours à la ligne d'origine.
 * Renvoie le texte complet quand `count` dépasse le nombre de mots.
 */
export function revealWords(text: string, count: number): string {
  if (count <= 0) return '';
  const pattern = /\S+/g;
  let seen = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    seen += 1;
    if (seen === count) return text.slice(0, match.index + match[0].length);
  }
  return text;
}

/**
 * Rend affichable un texte Markdown tronqué : retire un marqueur de citation ou un lien
 * entamé (« [1 », « [texte](http ») et referme un gras ouvert, pour éviter les symboles bruts.
 */
export function balancePartialMarkdown(partial: string): string {
  let text = partial.replace(/\[[^\]\n]*$/, '').replace(/\[[^\]\n]*\]\([^)\n]*$/, '');
  if ((text.match(/\*\*/g)?.length ?? 0) % 2 === 1) text = `${text}**`;
  return text.trimEnd();
}

function countWords(text: string): number {
  return text.match(/\S+/g)?.length ?? 0;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Révèle progressivement une réponse déjà vérifiée par le garde-fou, à la manière d'un modèle
 * qui écrit. Le serveur ne diffuse pas la réponse en continu : elle n'est montrée qu'une fois
 * validée (citations, chiffres), l'effet est donc purement visuel.
 */
export function useTypewriter(
  text: string,
  enabled: boolean,
  onProgress?: () => void,
): { readonly visible: string; readonly done: boolean } {
  const total = countWords(text);
  const animate = enabled && total > 0 && !prefersReducedMotion();
  const [count, setCount] = useState<number>(animate ? 0 : total);
  const progress = useRef(onProgress);
  progress.current = onProgress;

  useEffect(() => {
    if (!animate) {
      setCount(total);
      return;
    }
    // Les longues réponses s'écrivent plus vite par intervalle pour ne pas faire attendre
    const perTick = Math.max(MIN_WORDS_PER_TICK, Math.ceil(total / (TARGET_DURATION_MS / TICK_MS)));
    const timer = window.setInterval(() => {
      setCount((current) => {
        const next = Math.min(total, current + perTick);
        if (next >= total) window.clearInterval(timer);
        return next;
      });
      progress.current?.();
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [animate, total]);

  const done = count >= total;
  return { visible: done ? text : balancePartialMarkdown(revealWords(text, count)), done };
}
