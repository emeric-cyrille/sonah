'use client';

import { useRef, type PointerEvent, type ReactNode } from 'react';

const MAX_TILT_DEG = 9;

/** Carte qui s'incline en 3D sous le pointeur, avec un reflet lumineux. */
export function TiltCard({
  children,
  className = '',
}: {
  readonly children: ReactNode;
  readonly className?: string;
}): JSX.Element {
  const card = useRef<HTMLDivElement>(null);

  const onMove = (event: PointerEvent<HTMLDivElement>): void => {
    const element = card.current;
    if (!element || event.pointerType !== 'mouse') return;
    const rect = element.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    element.style.setProperty('--rx', `${(0.5 - py) * MAX_TILT_DEG * 2}deg`);
    element.style.setProperty('--ry', `${(px - 0.5) * MAX_TILT_DEG * 2}deg`);
    element.style.setProperty('--gx', `${px * 100}%`);
    element.style.setProperty('--gy', `${py * 100}%`);
  };

  const onLeave = (): void => {
    const element = card.current;
    if (!element) return;
    element.style.setProperty('--rx', '0deg');
    element.style.setProperty('--ry', '0deg');
  };

  return (
    <div className="[perspective:1000px]">
      <div
        ref={card}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className={`tilt-card ${className}`}
      >
        {children}
        <div className="tilt-glare" aria-hidden="true" />
      </div>
    </div>
  );
}
