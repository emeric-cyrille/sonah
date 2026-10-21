/** Petit orbe animé en CSS : avatar de Sonah dans la conversation et le logo. */
export function OrbAvatar({
  className = 'h-9 w-9',
  thinking = false,
}: {
  readonly className?: string;
  readonly thinking?: boolean;
}): JSX.Element {
  return (
    <span
      className={`orb-css relative inline-block shrink-0 rounded-full ${thinking ? 'orb-thinking' : ''} ${className}`}
      aria-hidden="true"
    />
  );
}
