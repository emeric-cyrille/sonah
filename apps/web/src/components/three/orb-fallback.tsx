/** Orbe statique en CSS : affiché pendant le chargement de la 3D ou sans WebGL. */
export function OrbFallback({ className = '' }: { readonly className?: string }): JSX.Element {
  return (
    <div className={`flex h-full w-full items-center justify-center ${className}`}>
      <div className="orb-css aspect-square w-[42%]" />
    </div>
  );
}
