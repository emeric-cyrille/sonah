export function Logo({ className = 'h-8 w-8' }: { className?: string }): JSX.Element {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#007a5e" />
      <path
        d="M16 6l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z"
        fill="#fcd116"
      />
    </svg>
  );
}
