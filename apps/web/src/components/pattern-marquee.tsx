'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n/provider';
import { PATTERN_SWATCHES, PatternFill } from './patterns/cameroon-patterns';

const REPEAT = 4;

/** Bandeau défilant des motifs camerounais, avec bouton pause (WCAG 2.2.2). */
export function PatternMarquee(): JSX.Element {
  const { dict } = useI18n();
  const [paused, setPaused] = useState<boolean>(false);
  const items = Array.from({ length: REPEAT }, () => PATTERN_SWATCHES).flat();

  return (
    <div className="relative mt-12">
      <div className="container-page mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          aria-pressed={paused}
          className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-paper/90 transition-colors hover:border-sun hover:text-sun"
        >
          {paused ? (
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
              <path d="M6 4.5v11l9-5.5z" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
              <path d="M6 4h3v12H6zM11 4h3v12h-3z" fill="currentColor" />
            </svg>
          )}
          {paused ? dict.home.marqueePlay : dict.home.marqueePause}
        </button>
      </div>
      <div className={`marquee ${paused ? 'marquee-paused' : ''}`}>
        <ul className="marquee-track gap-5 pl-5">
          {items.map((swatch, index) => {
            const label = dict.patterns[swatch.name as keyof typeof dict.patterns];
            return (
              <li
                key={`${swatch.name}-${index}`}
                className="relative h-48 w-72 shrink-0 overflow-hidden rounded-3xl ring-1 ring-white/10 sm:h-56 sm:w-80"
                aria-hidden={index >= PATTERN_SWATCHES.length}
              >
                <PatternFill name={swatch.name} id={`swatch-${swatch.name}-${index}`} />
                <div className="absolute bottom-4 left-4 rounded-2xl bg-black/75 px-4 py-2.5 backdrop-blur-md">
                  <p className="font-display text-xl leading-tight">
                    {label?.label ?? swatch.label}
                  </p>
                  <p className="text-xs text-paper/80">{label?.origin ?? swatch.origin}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
