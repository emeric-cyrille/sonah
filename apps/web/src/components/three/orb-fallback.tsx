/**
 * Orbe statique en CSS : affiché pendant le chargement de la 3D, sans WebGL,
 * sur petit écran, en économie de données ou avec « mouvement réduit ».
 */
export function OrbFallback({ className = '' }: { readonly className?: string }): JSX.Element {
  return (
    <div
      className={`flex h-full w-full items-center justify-center ${className}`}
      aria-hidden="true"
    >
      <div className="orb-css relative aspect-square w-[42%]" />
    </div>
  );
}
