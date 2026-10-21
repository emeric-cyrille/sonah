export function Logo({ className = 'h-9 w-9' }: { className?: string }): JSX.Element {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <line x1="20" y1="8" x2="20" y2="3" stroke="#181b34" strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="3.5" r="2.6" fill="#e8a317" stroke="#181b34" strokeWidth="1.2" />
      <rect
        x="3"
        y="8"
        width="34"
        height="27"
        rx="11"
        fill="#fbf8f2"
        stroke="#181b34"
        strokeWidth="2.2"
      />
      <rect x="8" y="13" width="24" height="17" rx="7" fill="#181b34" />
      <rect x="13" y="17" width="3.6" height="6" rx="1.8" fill="#e8a317" />
      <rect x="23.4" y="17" width="3.6" height="6" rx="1.8" fill="#e8a317" />
      <path
        d="M16.5 25.5 q3.5 2.6 7 0"
        fill="none"
        stroke="#e8a317"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
