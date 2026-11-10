// Logotipo provisional de Hunter: texto + mira en la «u». Se sustituye cuando haya logo definitivo.
export function HunterLogo({ className = "h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 168 40" role="img" aria-label="Hunter" className={className}>
      <text x="0" y="31" fill="currentColor" fontFamily="inherit" fontSize="34" fontWeight="800" letterSpacing="-1">
        H
      </text>
      <g transform="translate(36 21)">
        <circle r="12" fill="none" stroke="#ff6a1f" strokeWidth="4" />
        <circle r="3.5" fill="#c6f432" />
        <path d="M0-17v6M0 11v6M-17 0h6M11 0h6" stroke="#ff6a1f" strokeWidth="3.5" strokeLinecap="round" />
      </g>
      <text x="56" y="31" fill="currentColor" fontFamily="inherit" fontSize="34" fontWeight="800" letterSpacing="-1">
        nter
      </text>
    </svg>
  );
}
